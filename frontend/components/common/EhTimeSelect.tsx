import { FC, useCallback, useMemo } from "react";

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

// I suspect this is not a good idea to do in the context of daylight savings time switches.
// Not sure how to handle this. Probably just store the time without timezone in the database,
// then assume it is german time on the given day it is required to be displayed in whatever local timezone you want.
// but that is a backend issue
export const extractLocalTimeFromTimeTz = (timetz: string) => {
  if (timetz == null) {
    return "00:00";
  }

  const [hoursStr, minutesStr, secondsWithoffsetStr] = timetz.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const offset = Number(secondsWithoffsetStr.substring(2));
  const localOffset = new Date().getTimezoneOffset() / 60;
  const deltaOffset = offset - localOffset;
  const offsetHours = (hours + deltaOffset) % 24;
  return format2Digits(offsetHours) + ":" + format2Digits(minutes);
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
  const onChangeEvent = useCallback((event) => onChange(event.target.value), [
    onChange,
  ]);

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
