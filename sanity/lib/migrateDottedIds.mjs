import { createClient } from "@sanity/client";

// Sanity treats a dot in a document ID as a path separator. The anonymous read
// grant on a public dataset is scoped to `_id in path("*")` — a single path
// segment — so a document with a dotted ID (e.g. `category.abayas`) sits in a
// nested path namespace and is invisible to unauthenticated readers, exactly
// like `drafts.*` documents are. Seeded category/subCategory documents used
// dotted IDs and were therefore unreadable by the storefront.
//
// This migration re-creates those documents under dot-free IDs, repoints every
// reference to them (at any nesting depth), and removes the originals.
//
// Dry run:  node --env-file=.env.local sanity/lib/migrateDottedIds.mjs
// Apply:    node --env-file=.env.local sanity/lib/migrateDottedIds.mjs --apply

const requiredEnv = ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET", "SANITY_API_TOKEN"];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const dotFreeId = (id) => id.replace(/\./g, "-");

const stripSystemFields = ({ _rev, _createdAt, _updatedAt, _system, ...doc }) => doc;

// Walk any value, rewriting every `_ref` that points at a migrated document.
// Returns [rewrittenValue, changeCount] so we can report what actually moved.
function remapReferences(value, idMap) {
  if (Array.isArray(value)) {
    let changes = 0;
    const next = value.map((entry) => {
      const [rewritten, count] = remapReferences(entry, idMap);
      changes += count;
      return rewritten;
    });
    return [next, changes];
  }

  if (value && typeof value === "object") {
    let changes = 0;
    const next = {};

    for (const [key, entry] of Object.entries(value)) {
      if (key === "_ref" && typeof entry === "string" && idMap.has(entry)) {
        next[key] = idMap.get(entry);
        changes += 1;
        continue;
      }

      const [rewritten, count] = remapReferences(entry, idMap);
      next[key] = rewritten;
      changes += count;
    }

    return [next, changes];
  }

  return [value, 0];
}

const dottedDocs = await client.fetch(
  `*[_type in ["category", "subCategory"] && "." in string::split(_id, "")]{...}`,
);

if (dottedDocs.length === 0) {
  console.log("No dotted-ID category/subCategory documents found. Nothing to migrate.");
  process.exit(0);
}

const idMap = new Map(dottedDocs.map((doc) => [doc._id, dotFreeId(doc._id)]));

console.log(`\nDocuments to migrate (${dottedDocs.length}):`);
for (const doc of dottedDocs) {
  console.log(`  ${doc._id}  ->  ${idMap.get(doc._id)}   (${doc._type}: ${doc.title})`);
}

// Any document pointing at a dotted document needs its reference repointed.
// Fetch them whole so nested references (e.g. homepage.productSections[].category)
// are rewritten too, not just top-level ones.
const referringDocs = await client.fetch(`*[references($ids)]{...}`, { ids: [...idMap.keys()] });

const rewrites = referringDocs
  .map((doc) => {
    const [rewritten, changes] = remapReferences(doc, idMap);
    return { doc, rewritten, changes };
  })
  .filter(({ doc, changes }) => changes > 0 && !idMap.has(doc._id));

console.log(`\nReferences to repoint (${rewrites.length} documents):`);
for (const { doc, changes } of rewrites) {
  console.log(`  [${doc._type}] ${doc.title || doc._id}: ${changes} reference(s)`);
}

// A migrated document may itself reference another migrated document (a
// subCategory points at its parent category), so remap those in place too.
const migrated = dottedDocs.map((doc) => {
  const [rewritten] = remapReferences(stripSystemFields(doc), idMap);
  return { ...rewritten, _id: idMap.get(doc._id) };
});

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to perform the migration.");
  process.exit(0);
}

const tx = client.transaction();

// 1. Recreate each dotted document under its dot-free ID.
for (const doc of migrated) {
  tx.createOrReplace(doc);
}

// 2. Repoint everything that referenced a dotted document.
for (const { rewritten } of rewrites) {
  tx.createOrReplace(stripSystemFields(rewritten));
}

// 3. Remove the originals now that nothing points at them.
for (const id of idMap.keys()) {
  tx.delete(id);
}

await tx.commit();

console.log(`\nMigrated ${migrated.length} documents and repointed ${rewrites.length} referencing documents.`);
