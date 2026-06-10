export function ProofLogo({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path
        d="M5 24L5 18M9.5 24L9.5 13M14 24L14 8"
        stroke="var(--proof-blue)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M18.5 24Q18.5 15 20.5 12L26 19"
        stroke="var(--proof-blue-hover)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
