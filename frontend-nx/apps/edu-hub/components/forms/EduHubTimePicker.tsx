import React, { ChangeEvent, useCallback } from 'react';
import { prioritizeClasses } from '../../helpers/util';
import useTranslation from 'next-translate/useTranslation';

interface EduHubTimePickerProps {
  label: string;
  value: Date | string | null | undefined;
  onChange: (time: string | null) => void;
  className?: string;
}

const EduHubTimePicker: React.FC<EduHubTimePickerProps> = ({
  label,
  value,
  onChange,
  className = '',
}) => {
  const { t } = useTranslation();

  const formatTimeValue = (val: Date | string | null | undefined): string => {
    if (!val) return '';
    if (val instanceof Date) {
      // Handle both valid and invalid Date objects
      const hours = val.getHours().toString().padStart(2, '0');
      const minutes = val.getMinutes().toString().padStart(2, '0');
      return isNaN(val.getTime()) ? '' : `${hours}:${minutes}`;
    }
    if (typeof val === 'string') {
      return val.substring(0, 5);
    }
    return '';
  };

  const timeValue = formatTimeValue(value);

  const handleChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    onChange(newValue === '' ? null : newValue);
  }, [onChange]);

  // Generate time options
  const timeOptions = [];
  for (let i = 0; i < 24 * 4; i++) {
    const hours = Math.floor(i / 4).toString().padStart(2, '0');
    const minutes = ((i % 4) * 15).toString().padStart(2, '0');
    timeOptions.push(`${hours}:${minutes}`);
  }

  const baseClassName = 'w-full h-12 px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClassName} ${className}`);

  return (
    <div className="px-2">
      <div className="text-gray-400">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">{label}</div>
        </div>
        <div>
          <select
            className={finalClassName}
            onChange={handleChange}
            value={timeValue}
          >
            <option value="">{t('common:select_time')}</option>
            {timeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default EduHubTimePicker;
