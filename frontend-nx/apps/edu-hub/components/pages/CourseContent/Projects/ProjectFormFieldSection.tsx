import { FC, ReactNode } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline } from '@mui/icons-material';
import { prioritizeClasses } from '../../../../helpers/util';

interface ProjectFormFieldSectionProps {
  /** Optional DOM id, used as a scroll anchor (see SubmissionBlockedDialog). */
  id?: string;
  title: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
}

/** Section title + help icon above a bordered field (matches upload field layout). */
const ProjectFormFieldSection: FC<ProjectFormFieldSectionProps> = ({
  id,
  title,
  tooltip,
  children,
  className,
}) => (
  <div id={id} className={prioritizeClasses(`space-y-2 ${className ?? ''}`)}>
    <div className="flex items-center gap-2">
      <h4 className="text-sm font-semibold text-label-primary">{title}</h4>
      {tooltip ? (
        <Tooltip
          title={
            <span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{tooltip}</span>
          }
          placement="top"
          enterTouchDelay={0}
        >
          <IconButton
            type="button"
            size="small"
            aria-label={title}
            sx={{ padding: 0, color: 'var(--eduhub-label-disabled)' }}
          >
            <HelpOutline className="!text-base" />
          </IconButton>
        </Tooltip>
      ) : null}
    </div>
    {children}
  </div>
);

export default ProjectFormFieldSection;
