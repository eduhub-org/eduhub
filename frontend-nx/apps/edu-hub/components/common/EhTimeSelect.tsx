import { ChangeEvent, FC, useCallback, useMemo } from 'react';
import { format2Digits, useFormatTime } from '../../helpers/dateTimeHelpers';

interface IProps {
  value?: string;
  className?: string;
  onChange: (value: string) => any;
}

const EhTimeSelect: FC<IProps> = ({ value, onChange, className }) => {
  const formatTime = useFormatTime();

  const nowTime = useMemo(() => formatTime(new Date()), [formatTime]);

  const options: string[] = useMemo(() => {
    const opts: string[] = [];
    for (let i = 0; i < 24 * 4; i++) {
      const iMinutes = i * 15;
      const hours = Math.floor(iMinutes / 60);
      const minutes = iMinutes % 60;
      opts.push(format2Digits(hours) + ':' + format2Digits(minutes));
    }
    return opts;
  }, []);

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
