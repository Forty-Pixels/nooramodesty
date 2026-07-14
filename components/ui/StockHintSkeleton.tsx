// Placeholder for the "Only N in stock" line while the stock lookup is in flight.
// Sized to match that line so the row doesn't shift when the real number lands.
export const StockHintSkeleton = () => (
    <div className="flex items-center gap-1.5" aria-live="polite">
        <span className="h-2 w-24 animate-pulse rounded-sm bg-gray-200" aria-hidden="true" />
        <span className="sr-only">Checking stock</span>
    </div>
);
