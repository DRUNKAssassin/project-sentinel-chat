export function ContourLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0,120 C150,90 300,150 450,110 C600,70 750,140 900,100 C1000,75 1100,110 1200,90"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path
        d="M0,150 C150,120 300,175 450,140 C600,105 750,165 900,130 C1000,110 1100,140 1200,120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M0,90 C150,60 300,115 450,80 C600,45 750,105 900,65 C1000,45 1100,75 1200,55"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.25"
      />
    </svg>
  );
}