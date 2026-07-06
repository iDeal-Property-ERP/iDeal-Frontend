export type BarGroup = {
  label: string;
  primary: number;
  secondary: number;
};

/**
 * A grouped (paired) bar chart rendered with flex divs and theme tokens — two
 * 16px bars per group (primary + accent), rounded tops, month labels beneath,
 * no axes/gridlines, matching the Figma "Revenue vs payouts" chart.
 * @param props - The bar groups and the two series colors.
 * @returns The bar chart element.
 */
export function GroupedBarChart(props: {
  data: BarGroup[];
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const primaryColor = props.primaryColor ?? 'var(--color-primary)';
  const secondaryColor = props.secondaryColor ?? 'var(--color-accent-brand)';
  const max = Math.max(1, ...props.data.flatMap((d) => [d.primary, d.secondary]));

  return (
    <div className="flex h-[200px] w-full items-stretch gap-[18px]">
      {props.data.map((group) => (
        <div key={group.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end justify-center gap-1">
            <span
              className="w-4 rounded-t-[4px]"
              style={{ height: `${(group.primary / max) * 100}%`, backgroundColor: primaryColor }}
            />
            <span
              className="w-4 rounded-t-[4px]"
              style={{
                height: `${(group.secondary / max) * 100}%`,
                backgroundColor: secondaryColor,
              }}
            />
          </div>
          <span className="text-xs leading-4 text-muted-foreground">{group.label}</span>
        </div>
      ))}
    </div>
  );
}
