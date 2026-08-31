export function LoadingPlaceholder({ className = "" }: { className?: string }) {
  return <div className={`loading-placeholder ${className}`.trim()} role="status" aria-busy="true" aria-label="Loading">
    <span className="loading-skeleton loading-skeleton-wide" />
    <span className="loading-skeleton loading-skeleton-medium" />
    <span className="loading-skeleton loading-skeleton-short" />
  </div>;
}
