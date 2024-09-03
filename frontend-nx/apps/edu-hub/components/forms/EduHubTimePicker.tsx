import React, { ChangeEvent, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@material-ui/core/Tooltip';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { prioritizeClasses } from '../../helpers/util';

const format2Digits = (n: number) => {
  return `${n < 10 ? '0' : ''}${n}`;
};

const formatTime = (time: Date | null): string => {
  if (time == null) {
    return formatTime(new Date());
  }
  return format2Digits(time.getHours()) + ':' + format2Digits(Math.round(time.getMinutes() / 15) * 15);
};

const now = new Date();
const nowTime = formatTime(now);

interface EduHubTimePickerProps {
  label?: string;
  value: string; // Should be in HH:mm format for 24-hour time, e.g., '14:30' for 2:30 PM
  onChange: (time: string) => void; // Change the type to match the expected input of the function
  className?: string;
  helpText?: string;
  translationNamespace?: string;
}

const EduHubTimePicker: React.FC<EduHubTimePickerProps> = ({
  label = null,
  value,
  onChange,
  className = '',
  helpText,
  translationNamespace,
  ...props // rest of the props
}) => {
  const { t } = useTranslation(translationNamespace);

  const timeOptions = [];
  for (let i = 0; i < 24 * 4; i++) {
    const iMinutes = i * 15;
    const hours = Math.floor(iMinutes / 60);
    const minutes = iMinutes % 60;
    timeOptions.push(formatTime(new Date(0, 0, 0, hours, minutes)));
  }
  const baseClassName = 'w-full h-12 px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClassName} ${className}`);

  const handleChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value), [onChange]);

  return (
    <div className="px-2">
      <div className="text-gray-400">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            {helpText && (
              <Tooltip title={t(helpText)} placement="top">
                <HelpOutlineIcon style={{ cursor: 'pointer', marginRight: '5px' }} />
              </Tooltip>
            )}
            {label}
          </div>
        </div>
        <div>
          <select
            className={finalClassName}
            onChange={handleChange}
            value={value ?? nowTime}
            {...props} // spread the rest of the props
          >
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
