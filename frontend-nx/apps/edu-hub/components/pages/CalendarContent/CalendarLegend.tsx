import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { LOCATION_COLORS } from '../../../helpers/calendarColors';

const CalendarLegend: FC = () => {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded border-2 border-dashed border-label-secondary"
          aria-hidden
        />
        <span className="text-sm text-label-secondary">{t('calendar.filter_events')}</span>
      </div>
      {Object.entries(LOCATION_COLORS).map(([location, colors]) => (
        <div key={location} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.border }}
            aria-hidden
          />
          <span className="text-sm text-label-secondary">
            {t(`common.location.${location}`)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CalendarLegend;
