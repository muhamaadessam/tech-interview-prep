export function LoadingPlaceholder({ className = "" }: { className?: string }) {
  return <div className={`loading-placeholder ${className}`.trim()} role="status" aria-busy="true" aria-label="Loading">
    <span /><span /><span />
  </div>;
}
