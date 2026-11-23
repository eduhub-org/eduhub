import Head from 'next/head';
import Link from 'next/link';
import { Children, FC, ReactNode, isValidElement } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Page } from '../../layout/Page';
import { ManualAudience, headingId, manualHref, resolveManualLink } from '../../../lib/manual/markdown';

export interface HelpPageData {
  slug: string;
  title: string;
  summary: string;
  audience: ManualAudience[];
  body: string;
}

export interface HelpNavSection {
  slug: string;
  title: string;
  pages: { slug: string; title: string }[];
}

export interface HelpContentProps {
  page: HelpPageData;
  sections: HelpNavSection[];
  /** The page is shown in the other language because it is not translated yet. */
  isFallback: boolean;
}

const textOf = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return textOf(child.props.children);
      return '';
    })
    .join('');

/** Headings get stable ids and internal links stay inside the app, so `/help/<slug>#<id>` can be cited. */
export const manualComponents = (slug: string): Components => ({
  h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(textOf(children))}>{children}</h3>,
  a: ({ href = '', children }) => {
    const target = resolveManualLink(href, slug);
    if (target.startsWith('/') || target.startsWith('#')) return <Link href={target}>{children}</Link>;
    return (
      <a href={target} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
});

const ManualNav: FC<{ sections: HelpNavSection[]; currentSlug: string }> = ({ sections, currentSlug }) => {
  const t = useTranslations('help');
  const linkClass = (slug: string) =>
    `block py-1 hover:text-brand ${slug === currentSlug ? 'font-semibold text-brand' : 'text-label-primary'}`;

  return (
    <nav aria-label={t('nav_label')}>
      <Link href={manualHref('')} className={linkClass('')}>
        {t('start')}
      </Link>
      {sections.map((section) => (
        <div key={section.slug} className="mt-4">
          <Link href={manualHref(section.slug)} className={`${linkClass(section.slug)} uppercase text-sm tracking-wide`}>
            {section.title}
          </Link>
          <ul className="ml-3 border-l border-border-primary pl-3">
            {section.pages.map((page) => (
              <li key={page.slug}>
                <Link
                  href={manualHref(page.slug)}
                  className={linkClass(page.slug)}
                  aria-current={page.slug === currentSlug ? 'page' : undefined}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};

export const HelpContent: FC<HelpContentProps> = ({ page, sections, isFallback }) => {
  const t = useTranslations('help');
  const rulesUrl = process.env.NEXT_PUBLIC_HELP_DOCS_URL;

  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Head>
        <title>{`${page.title} | ${t('title')} | EduHub`}</title>
        <meta name="description" content={page.summary} />
      </Head>
      <Page className="text-label-primary">
        <div className="px-4 pt-20 pb-8 lg:px-12 lg:pt-28 lg:flex lg:gap-12">
          <aside className="lg:w-72 lg:flex-shrink-0">
            <details className="lg:hidden mb-6 rounded-lg border border-border-primary p-3">
              <summary className="cursor-pointer font-semibold">{t('nav_label')}</summary>
              <div className="mt-3">
                <ManualNav sections={sections} currentSlug={page.slug} />
              </div>
            </details>
            <div className="hidden lg:block lg:sticky lg:top-24">
              <p className="mb-3 text-xl font-bold">{t('title')}</p>
              <ManualNav sections={sections} currentSlug={page.slug} />
            </div>
          </aside>

          <article className="min-w-0 flex-1">
            {isFallback && (
              <p role="note" className="mb-6 rounded-lg border border-border-primary bg-bg-secondary p-3 text-sm">
                {t('fallback_notice')}
              </p>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 break-words">{page.title}</h1>
            <p className="mb-6 text-sm text-label-secondary">
              {t('audience_label')}: {page.audience.map((audience) => t(`audience.${audience}`)).join(', ')}
            </p>
            <div className="prose max-w-none break-words prose-headings:text-label-primary prose-headings:scroll-mt-24 prose-p:text-label-primary prose-li:text-label-primary prose-strong:text-label-primary prose-a:text-brand">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={manualComponents(page.slug)}>
                {page.body}
              </ReactMarkdown>
            </div>
            {rulesUrl && (
              <div className="mt-10 rounded-lg border border-border-primary p-4">
                <p className="font-semibold">{t('org_rules_title')}</p>
                <p className="text-sm mt-1">{t('org_rules_text')}</p>
                <a href={rulesUrl} target="_blank" rel="noopener noreferrer" className="text-brand text-sm mt-2 inline-block">
                  {t('org_rules_link')}
                </a>
              </div>
            )}
          </article>
        </div>
      </Page>
    </div>
  );
};

export default HelpContent;
