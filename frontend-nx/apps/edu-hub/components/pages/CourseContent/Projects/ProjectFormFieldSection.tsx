import { FC, ReactNode } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline } from '@mui/icons-material';
import { prioritizeClasses } from '../../../../helpers/util';

interface ProjectFormFieldSectionProps {
  title: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
}

/** Section title + help icon above a bordered field (matches upload field layout). */
const ProjectFormFieldSection: FC<ProjectFormFieldSectionProps> = ({
  title,
  tooltip,
  children,
  className,
}) => (
  <div className={prioritizeClasses(`space-y-2 ${className ?? ''}`)}>
    <div className="flex items-center gap-2">
      <h4 className="text-sm font-semibold text-label-primary">{title}</h4>
      {tooltip ? (
        <Tooltip
          title={
            <span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{tooltip}</span>
          }
          placement="top"
        >
          <HelpOutline
            className="!text-base"
            style={{ cursor: 'pointer', color: 'var(--eduhub-label-disabled)' }}
            aria-hidden
          />
        </Tooltip>
      ) : null}
    </div>
    {children}
  </div>
);

export default ProjectFormFieldSection;
