import { FC, ReactNode } from 'react';

/**
 * Unified course-page section heading.
 *
 * One size, one weight, one color, one bottom margin for EVERY section title on
 * the course page (Mein Projekt, Projekte in diesem Kurs, Anwesenheiten, Termine,
 * "Das wirst du lernen", …). Render it as a direct child of the page's
 * `max-w-screen-xl` content column — i.e. ABOVE each card, never nested inside a
 * card's inner padding — so all titles share the same left edge.
 *
 * Replaces the previous mix of `text-lg` / `text-2xl` / `text-3xl` / <BlockTitle>.
 */
interface SectionTitleProps {
  children: ReactNode;
  /** Extra utility classes (e.g. spacing overrides). Optional. */
  className?: string;
  id?: string;
}

export const SectionTitle: FC<SectionTitleProps> = ({ children, className = '', id }) => (
  <h2 id={id} className={`text-3xl font-semibold text-label-primary mb-6 ${className}`}>
    {children}
  </h2>
);

export default SectionTitle;
