export function BrandLogo() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <svg viewBox="0 0 40 40" role="img" focusable="false">
        <defs>
          <linearGradient id="brand-gradient" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#62d2ff" />
            <stop offset="1" stopColor="#087ea4" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#brand-gradient)" />
        <path d="M11 15.5 16 20l-5 4.5M29 15.5 24 20l5 4.5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 27.5h3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
