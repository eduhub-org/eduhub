import { FC, ReactNode } from 'react';
import { Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

interface CardProps {
  readonly children: ReactNode;
  readonly title?: string;
  readonly helpText?: string;
  readonly className?: string;
}

/**
 * Standard card component for consistent styling across EduHub.
 * Uses theme variables for background, border, and rounded corners.
 */
export const Card: FC<CardProps> = ({ children, title, helpText, className = '' }) => (
  <div
    className={`bg-fill-primary border border-border-primary rounded-lg p-4 ${className}`.trim()}
  >
    {(title || helpText) && (
      <div className="flex items-center gap-2 mb-3">
        {title && <span className="text-sm font-medium text-label-primary">{title}</span>}
        {helpText && (
          <Tooltip title={helpText} placement="top">
            <HelpOutline
              style={{ cursor: 'pointer', color: 'var(--eduhub-label-disabled)', fontSize: '1.25rem' }}
            />
          </Tooltip>
        )}
      </div>
    )}
    {children}
  </div>
);

export default Card;
