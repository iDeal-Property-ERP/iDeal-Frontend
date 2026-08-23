import { useTranslations } from 'next-intl';
import { Link } from '@/libs/I18nNavigation';

const COLUMNS = [
  {
    heading: 'col_rent',
    links: [
      { href: '/listings', key: 'link_browse_homes' },
      { href: '/how-it-works', key: 'link_how' },
      { href: '/', key: 'link_neighborhoods' },
      { href: '/', key: 'link_saved' },
    ],
  },
  {
    heading: 'col_owners',
    links: [
      { href: '/list-your-property', key: 'link_list' },
      { href: '/how-it-works', key: 'link_guaranteed_income' },
      { href: '/', key: 'link_owner_dashboard' },
      { href: '/', key: 'link_pricing' },
    ],
  },
  {
    heading: 'col_company',
    links: [
      { href: '/', key: 'link_about' },
      { href: '/', key: 'link_careers' },
      { href: '/', key: 'link_contact' },
      { href: '/', key: 'link_blog' },
    ],
  },
  {
    heading: 'col_legal',
    links: [
      { href: '/tos', key: 'link_terms_of_use' },
      { href: '/privacy-policy', key: 'link_privacy' },
      { href: '/', key: 'link_contracts' },
      { href: '/', key: 'link_deposit_policy' },
    ],
  },
] as const;

/**
 * Public marketing footer — brand block + Rent / Owners / Company / Legal columns and a
 * bottom bar with copyright, language and legal links (Figma 210:2).
 * @returns The marketing footer.
 */
export function MarketingFooter() {
  const t = useTranslations('Marketing');

  return (
    <footer className="border-t border-border bg-muted">
      <div className="container-page flex flex-col gap-6 pt-10 pb-6 lg:flex-row lg:justify-between lg:gap-12 lg:py-14">
        <div className="max-w-sm">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-xl font-bold tracking-tight text-foreground"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              i
            </span>
            iDeal
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">{t('footer_tagline')}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-12 sm:gap-y-8 lg:gap-x-16">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-[13px] font-semibold text-foreground lg:text-sm">
                {t(col.heading)}
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer_rights')}</p>
          <div className="hidden items-center gap-5 sm:flex">
            <span>{t('footer_lang')}</span>
            <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
              {t('link_privacy')}
            </Link>
            <Link href="/tos" className="transition-colors hover:text-foreground">
              {t('link_terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
