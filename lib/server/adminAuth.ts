import "server-only";

export function validateAdminSecret(headers: Headers): Response | null {
  const configuredSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;

  if (!configuredSecret) {
    return Response.json({ error: "Admin secret is not configured." }, { status: 500 });
  }

  if (headers.get("x-admin-secret") !== configuredSecret) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
