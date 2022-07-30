import { FC, useCallback, useMemo } from "react";
import Select from "react-select";

interface IProps {
  days: number[];
  startDate: Date;
  disabled?: boolean;
}

const rangeGroups = (indices: number[]) => {
  // input: [0,1,3,4,5]
  // output: [[0,2], [3], [4,5]]

  return indices
    .slice()
    .sort()
    .reduce((prev, cur) => {
      if (prev.length === 0) {
        return [[cur]];
      } else {
        const lastRange = prev[prev.length - 1];
        const lastRangeEnd = lastRange[lastRange.length - 1];
        if (lastRangeEnd + 1 === cur) {
          prev[prev.length - 1] = [lastRange[0], cur];
        } else {
          prev.push([cur]);
        }
        return prev;
      }
    }, [] as number[][]);
};

const dayFormat = (dnum: number, startDate: Date) => {
  const doffset = dnum - 1;
  const dayDate = new Date(startDate);
  dayDate.setDate(startDate.getDate() + doffset);

  const wdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const weekday = wdays[dayDate.getDay()];

  const p2 = (x: number) => {
    if (x < 10) return "0" + x;
    return "" + x;
  };

  return `${weekday}., ${p2(dayDate.getDate())}.${p2(dayDate.getMonth() + 1)}.`;
};

const rangeFormat = (range: number[], startDate: Date) => {
  if (range.length === 1) {
    return dayFormat(range[0], startDate);
  } else {
    return `${dayFormat(range[0], startDate)} bis ${dayFormat(
      range[1],
      startDate
    )}`;
  }
};

export const MultiDatePureDisplay: FC<IProps> = ({ days, startDate }) => {
  const ranges = rangeGroups(days).map((range) =>
    rangeFormat(range, startDate)
  );
  return <>{ranges.join(", ")}</>;
};

export const MultiDateDisplay: FC<IProps> = ({ days, startDate }) => {
  return (
    <div>
      <span className="font-bold">Mögliche Einsatztage: </span>
      <span>
        <MultiDatePureDisplay days={days} startDate={startDate} />
      </span>
    </div>
  );
};

interface MultiDaySelectorProps extends IProps {
  selectedDays?: number[];
  onSelectDays?: (days: number[]) => any;
  instanceId: string;
  id: string;
  className?: string;
}

export const MultiDateSelector: FC<MultiDaySelectorProps> = ({
  days,
  startDate,
  selectedDays,
  onSelectDays,
  instanceId,
  id,
  disabled,
  className,
}) => {
  const options = days.map((day) => ({
    value: day + "",
    label: dayFormat(day, startDate),
  }));

  const handleSelectDays = useCallback(
    (event) => {
      if (onSelectDays) {
        onSelectDays(event.map((e: any) => Number(e.value)));
      }
    },
    [onSelectDays]
  );

  const values = useMemo(() => {
    const mySelected = selectedDays || [];
    return mySelected
      .map((d) => options.find((o) => Number(o.value) === d))
      .filter((x) => x != null);
  }, [selectedDays, options]);

  return (
    <>
      <Select
        isDisabled={disabled}
        placeholder="Tage auswählen für Anmeldung"
        options={options}
        instanceId={instanceId}
        id={id}
        isMulti={true}
        value={values}
        onChange={handleSelectDays}
        className={className}
      />
    </>
  );
};
