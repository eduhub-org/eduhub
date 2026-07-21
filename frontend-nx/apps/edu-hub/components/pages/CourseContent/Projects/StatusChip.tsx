import { FC } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useTranslations } from 'next-intl';
import { ProjectRating_enum, ProjectStatus_enum } from '../../../../__generated__/globalTypes';
import {
  PROJECT_STATUS_CHIP_COMPLETED_PASSED,
  PROJECT_STATUS_CHIP_INCOMPLETE_FAILED,
  PROJECT_STATUS_CHIP_SUGGESTED_FOR_PUBLICATION,
  resolveProjectStatusChipKey,
} from './projectStatusDisplay';

const STATUS_CLASSES: Record<string, string> = {
  TEMPLATE: 'bg-gray-100 text-gray-700 border border-gray-300',
  PROPOSED: 'bg-gray-200 text-gray-800',
  ONGOING: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  [PROJECT_STATUS_CHIP_COMPLETED_PASSED]: 'bg-green-100 text-green-800',
  [PROJECT_STATUS_CHIP_SUGGESTED_FOR_PUBLICATION]:
    'bg-amber-100 text-amber-900 border border-amber-300',
  INCOMPLETE: 'bg-red-100 text-red-800',
  [PROJECT_STATUS_CHIP_INCOMPLETE_FAILED]: 'bg-red-100 text-red-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-900',
};

interface StatusChipProps {
  status: ProjectStatus_enum | string;
  rating?: ProjectRating_enum | null;
  ratingComment?: string | null;
  suggestedForPublication?: boolean | null;
  published?: boolean | null;
  /** Pre-resolved chip key (e.g. TEMPLATE from getProjectStatusChipKey). */
  displayKey?: string;
}

const StatusChip: FC<StatusChipProps> = ({
  status,
  rating,
  ratingComment,
  suggestedForPublication,
  published,
  displayKey,
}) => {
  const t = useTranslations('course');
  const chipKey =
    displayKey ??
    resolveProjectStatusChipKey(status, rating, suggestedForPublication, published);
  const className = STATUS_CLASSES[chipKey] ?? 'bg-gray-200 text-gray-800';
  const chip = (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}
    >
      {t(`projects.status.${chipKey}`)}
    </span>
  );

  const comment = ratingComment?.trim();
  if (!comment) {
    return chip;
  }

  return (
    <Tooltip title={comment}>
      <span className="inline-flex" tabIndex={0}>
        {chip}
      </span>
    </Tooltip>
  );
};

export default StatusChip;
