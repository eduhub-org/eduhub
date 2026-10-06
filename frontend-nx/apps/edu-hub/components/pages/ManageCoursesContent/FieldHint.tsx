import { FC, ReactNode } from 'react';

/**
 * Visible explanation under a field in the manage view. Used instead of a "?" tooltip, which
 * people rarely open, so every card explains itself the same way.
 */
const FieldHint: FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`mt-1 text-xs text-label-secondary ${className}`.trim()}>{children}</p>
);

export default FieldHint;
