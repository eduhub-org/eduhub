import { FC, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface SectionTitleProps {
  children: ReactNode;
  /** Extra utility classes (e.g. spacing overrides). Optional. */
  className?: string;
  id?: string;
}

export const SectionTitle: FC<SectionTitleProps> = ({ children, className = '', id }) => (
  // twMerge rather than interpolation: a caller passing `mb-0` used to lose to
  // the default `mb-6`, because which of two conflicting utilities wins is
  // decided by their order in the generated stylesheet, not in the attribute.
  <h2 id={id} className={twMerge('text-3xl font-semibold text-label-primary mb-6', className)}>
    {children}
  </h2>
);

export default SectionTitle;
