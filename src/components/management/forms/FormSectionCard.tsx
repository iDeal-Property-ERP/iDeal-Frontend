import type { ReactNode } from 'react';

type FormSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * A rounded, hairline-bordered form section card (Basics / Pricing / Photos),
 * matching the Figma 16px-radius surface with a 28px Bricolage-ish section title.
 * @param props - Title, optional description, and the section body.
 * @returns The section card.
 */
export function FormSectionCard(props: FormSectionCardProps) {
  const { title, description, children } = props;
  return (
    <section className="rounded-[16px] border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-[22px] leading-7 font-bold tracking-[-0.1px] text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
