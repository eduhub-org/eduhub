import { ChangeEvent, FC, useCallback } from "react";

interface IProps {
  value?: string;
  className?: string;
  onChange: (value: string) => any;
}

const format2Digits = (n: number) => {
  return `${n < 10 ? "0" : ""}${n}`;
};

export const formatTime = (time: Date | null): string => {
  if (time == null) {
    return formatTime(new Date());
  }
  return (
    format2Digits(time.getHours()) +
    ":" +
    format2Digits(Math.round(time.getMinutes() / 15) * 15)
  );
};

const now = new Date();
const nowTime = formatTime(now);

const options: string[] = [];
for (let i = 0; i < 24 * 4; i++) {
  const iMinutes = i * 15;
  const hours = Math.floor(iMinutes / 60);
  const minutes = iMinutes % 60;
  options.push(format2Digits(hours) + ":" + format2Digits(minutes));
}

// I tried to use react-time-picker, but it doesnt work with next.js due to global css imports from node_modules
const EhTimeSelect: FC<IProps> = ({ value, onChange, className }) => {
  const onChangeEvent = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value),
    [onChange]
  );

  return (
    <select
      className={className}
      onChange={onChangeEvent}
      value={value ?? nowTime}
    >
      {options.map((option, index) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default EhTimeSelect;
