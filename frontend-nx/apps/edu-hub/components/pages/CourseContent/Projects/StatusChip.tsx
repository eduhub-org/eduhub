import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { ProjectStatus_enum } from '../../../../__generated__/globalTypes';

const STATUS_CLASSES: Record<string, string> = {
  TEMPLATE: 'bg-gray-100 text-gray-700 border border-gray-300',
  PROPOSED: 'bg-gray-200 text-gray-800',
  ONGOING: 'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  INCOMPLETE: 'bg-red-100 text-red-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-900',
};

interface StatusChipProps {
  status: ProjectStatus_enum | string;
}

const StatusChip: FC<StatusChipProps> = ({ status }) => {
  const t = useTranslations('course');
  const className = STATUS_CLASSES[status] ?? 'bg-gray-200 text-gray-800';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}
    >
      {t(`projects.status.${status}`)}
    </span>
  );
};

export default StatusChip;
