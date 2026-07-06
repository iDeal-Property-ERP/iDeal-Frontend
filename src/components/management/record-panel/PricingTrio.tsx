export type PricingItem = {
  /** Overline label, e.g. "ASK PRICE". */
  label: string;
  /** Formatted price, e.g. "$680". */
  value: string;
  /** Caption under the price, e.g. "margin $120 · 18%". */
  caption: string;
};

/**
 * The pricing trio — three equal cards surfacing the trust-model economics
 * (ask / owner-guaranteed / tenant-charge). First-class, deliberate treatment
 * per the design principle that money gets a clear, visible home.
 * @param props - Exactly the three pricing items.
 * @returns The pricing trio element.
 */
export function PricingTrio(props: { items: PricingItem[] }) {
  return (
    <div className="grid w-full grid-cols-3 gap-2.5">
      {props.items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col gap-[3px] rounded-[12px] border border-border bg-background px-3.5 py-3"
        >
          <span className="text-[11px] leading-[14px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {item.label}
          </span>
          <span className="font-display text-[26px] leading-[30px] font-bold tracking-[-0.13px] text-foreground tabular-nums">
            {item.value}
          </span>
          <span className="truncate text-[12px] leading-4 text-muted-foreground">
            {item.caption}
          </span>
        </div>
      ))}
    </div>
  );
}
