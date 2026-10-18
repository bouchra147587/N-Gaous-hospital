type Props = {
  className?: string;
  size?: number;
};

/** A pair of open arcs echoing the twin green/red rings around the hospital emblem. */
export default function ArcMotif({ className = "", size = 420 }: Props) {
  const r1 = size * 0.46;
  const r2 = size * 0.38;
  const c = size / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle
        cx={c}
        cy={c}
        r={r1}
        fill="none"
        stroke="var(--green-deep)"
        strokeWidth={size * 0.018}
        strokeLinecap="round"
        strokeDasharray={`${r1 * 3.6} ${r1 * 6.28}`}
        transform={`rotate(-40 ${c} ${c})`}
        opacity={0.85}
      />
      <circle
        cx={c}
        cy={c}
        r={r2}
        fill="none"
        stroke="var(--brick)"
        strokeWidth={size * 0.014}
        strokeLinecap="round"
        strokeDasharray={`${r2 * 3.1} ${r2 * 6.28}`}
        transform={`rotate(150 ${c} ${c})`}
        opacity={0.55}
      />
    </svg>
  );
}
