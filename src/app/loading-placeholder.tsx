export type LoadingVariant = "compact" | "track" | "preferences" | "interview" | "session" | "question" | "form" | "moderator";

export function LoadingPlaceholder({ variant = "compact", className = "" }: { variant?: LoadingVariant; className?: string }) {
  return <div className={`loading-placeholder loading-${variant} ${className}`.trim()} role="status" aria-busy="true" aria-label="Loading">
    {variant === "track" && <><span className="loading-skeleton loading-skeleton-label" /><span className="loading-skeleton loading-skeleton-select" /></>}
    {variant === "preferences" && <><span className="loading-skeleton loading-skeleton-title" /><span className="loading-skeleton loading-skeleton-copy" /><div className="loading-skeleton-grid"><span /><span /><span /><span /></div><span className="loading-skeleton loading-skeleton-button" /></>}
    {(variant === "interview" || variant === "session") && <><span className="loading-skeleton loading-skeleton-eyebrow" /><span className="loading-skeleton loading-skeleton-heading" /><span className="loading-skeleton loading-skeleton-copy" /><div className="loading-skeleton-builder"><span /><span /><span /></div><span className="loading-skeleton loading-skeleton-card" /></>}
    {variant === "question" && <><div className="loading-skeleton-meta"><span /><span /></div><span className="loading-skeleton loading-skeleton-heading" /><span className="loading-skeleton loading-skeleton-copy" /><span className="loading-skeleton loading-skeleton-copy" /><span className="loading-skeleton loading-skeleton-short" /></>}
    {variant === "form" && <div className="loading-skeleton-form"><span /><span /><span /><span /><span /><span /></div>}
    {variant === "moderator" && <div className="loading-skeleton-list"><span /><span /><span /></div>}
    {variant === "compact" && <><span className="loading-skeleton loading-skeleton-wide" /><span className="loading-skeleton loading-skeleton-medium" /><span className="loading-skeleton loading-skeleton-short" /></>}
  </div>;
}
