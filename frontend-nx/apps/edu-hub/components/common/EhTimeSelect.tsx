import { ChangeEvent, FC, useCallback, useMemo } from 'react';

interface IProps {
  value?: string;
  className?: string;
  onChange: (value: string) => void;
}

// Function to format a number into a two-digit string
const format2Digits = (n: number) => `${n < 10 ? '0' : ''}${n}`;

// Function to format time into a "HH:MM" string, rounded to the nearest 15 minutes
export const formatTime = (time: Date | null): string => {
  const now = time || new Date();
  return `${format2Digits(now.getHours())}:${format2Digits(Math.round(now.getMinutes() / 15) * 15)}`;
};

// Generate time options at 15-minute intervals for 24 hours
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let i = 0; i < 24 * 4; i++) {
    const minutes = i * 15;
    const hours = Math.floor(minutes / 60);
    const remainderMinutes = minutes % 60;
    times.push(`${format2Digits(hours)}:${format2Digits(remainderMinutes)}`);
  }
  return times;
};

const EhTimeSelect: FC<IProps> = ({ value, onChange, className }) => {
  const nowTime = useMemo(() => formatTime(null), []);
  const options = useMemo(generateTimeOptions, []);

  const onChangeEvent = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value),
    [onChange]
  );

  return (
    <select className={className} onChange={onChangeEvent} value={value ?? nowTime}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default EhTimeSelect;
