export type DonutSegment = {
  value: number;
  /** CSS color value for the arc (e.g. "var(--color-primary)"). */
  color: string;
};

/**
 * A donut chart rendered as stacked stroked SVG arcs using theme tokens, with an
 * optional large center label. Matches the Figma "Occupancy" donut.
 * @param props - Segments, size, stroke width, and optional center label.
 * @returns The donut chart element.
 */
export function DonutChart(props: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}) {
  const size = props.size ?? 120;
  const strokeWidth = props.strokeWidth ?? 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = props.segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const active = props.segments.filter((s) => s.value > 0);

  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={strokeWidth}
        />
        {active.map((segment, index) => {
          const dash = (segment.value / total) * circumference;
          const element = (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return element;
        })}
      </svg>
      {props.centerLabel ? (
        <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-extrabold tracking-[-0.2px] text-foreground tabular-nums">
          {props.centerLabel}
        </span>
      ) : null}
    </div>
  );
}
