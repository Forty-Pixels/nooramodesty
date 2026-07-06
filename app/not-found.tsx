import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] bg-[#f6f5f3]">
      <EmptyState
        eyebrow="404"
        title="Page Not Found"
        message="The page you're looking for may have moved, sold out, or no longer exists."
        actionLabel="Return Home"
        actionHref="/"
      />
    </main>
  );
}
