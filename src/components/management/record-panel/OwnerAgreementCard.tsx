import { ShieldCheck } from 'lucide-react';

/**
 * The owner + agreement card — an avatar with the owner's initials, the owner
 * line and the management-agreement summary, and a status badge. Surfaces the
 * contract-backed relationship that underpins the trust model.
 * @param props - Initials, owner line, detail line, and an optional status.
 * @returns The owner/agreement card element.
 */
export function OwnerAgreementCard(props: {
  initials: string;
  ownerLine: string;
  detailLine: string;
  statusLabel?: string;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-[12px] border border-border bg-background px-4 py-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-medium text-primary-subtle-foreground">
        {props.initials}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-medium text-foreground">{props.ownerLine}</p>
        <p className="truncate text-xs text-muted-foreground">{props.detailLine}</p>
      </div>
      {props.statusLabel ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-success">
          <ShieldCheck className="size-[15px]" />
          {props.statusLabel}
        </span>
      ) : null}
    </div>
  );
}
