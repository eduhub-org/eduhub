import { ChangeEvent, FC, useCallback } from 'react';
import { format2Digits, formatTime } from '../../helpers/dateHelpers';

interface IProps {
  value?: string;
  className?: string;
  onChange: (value: string) => any;
}

const now = new Date();
const nowTime = formatTime(now);

const options: string[] = [];
for (let i = 0; i < 24 * 4; i++) {
  const iMinutes = i * 15;
  const hours = Math.floor(iMinutes / 60);
  const minutes = iMinutes % 60;
  options.push(format2Digits(hours) + ':' + format2Digits(minutes));
}

// I tried to use react-time-picker, but it doesnt work with next.js due to global css imports from node_modules
const EhTimeSelect: FC<IProps> = ({ value, onChange, className }) => {
  const onChangeEvent = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value),
    [onChange]
  );

  return (
    <select className={className} onChange={onChangeEvent} value={value ?? nowTime}>
      {options.map((option, index) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default EhTimeSelect;
