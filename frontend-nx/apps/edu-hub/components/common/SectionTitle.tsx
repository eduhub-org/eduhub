import { FC, ReactNode } from 'react';

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
