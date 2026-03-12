import { FC } from 'react';
import Popover from '@mui/material/Popover';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { getLocationLabel } from '../../../helpers/calendarColors';

interface SessionDetail {
  id: number;
  title: string;
  courseTitle: string;
  programTitle?: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  address?: string;
  speakers: { firstName: string; lastName: string }[];
}

interface IProps {
  session: SessionDetail | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const SessionDetailPopover: FC<IProps> = ({ session, anchorEl, onClose }) => {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === 'de' ? de : enUS;

  if (!session) return null;

  const start = new Date(session.startDateTime);
  const end = new Date(session.endDateTime);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          className: 'light p-5 max-w-sm',
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            backgroundColor: 'var(--eduhub-fill-primary)',
            color: 'var(--eduhub-label-primary)',
          },
        },
      }}
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-base text-label-primary">
            {session.courseTitle}
          </h3>
          {session.title && (
            <p className="text-sm text-label-secondary">{session.title}</p>
          )}
        </div>

        {session.programTitle && (
          <p className="text-xs text-label-disabled">{session.programTitle}</p>
        )}

        <div className="flex items-center gap-2 text-sm text-label-primary">
          <span>{format(start, 'PPP', { locale: dateLocale })}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-label-primary">
          <span>
            {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
          </span>
        </div>

        {session.location && (
          <div className="text-sm text-label-primary">
            <span className="font-medium">{t('common.place')}:</span>{' '}
            {getLocationLabel(session.location)}
            {session.address && (
              <span className="text-label-secondary block text-xs mt-0.5">
                {session.address}
              </span>
            )}
          </div>
        )}

        {session.speakers.length > 0 && (
          <div className="text-sm text-label-primary">
            <span className="font-medium">{t('common.speakers')}:</span>{' '}
            {session.speakers
              .map((s) => `${s.firstName} ${s.lastName}`)
              .join(', ')}
          </div>
        )}

        {session.description && (
          <p className="text-sm text-label-secondary border-t border-border-primary pt-2 mt-2">
            {session.description}
          </p>
        )}
      </div>
    </Popover>
  );
};

export default SessionDetailPopover;
