import { FC, useCallback } from "react";
import Select from "react-select";

interface IProps {
  minGrade?: number;
  maxGrade?: number;
  selectedGrade?: number;
  onSelectGrade?: (grade: number) => any;
  className?: string;
  instanceId: string;
  id: string;
}

export const GradeSelector: FC<IProps> = ({
  minGrade,
  maxGrade,
  selectedGrade,
  onSelectGrade,
  className,
  instanceId,
  id,
}) => {
  const minium = minGrade || 1;
  const maximum = maxGrade || 12;

  const options = [
    {
      value: minium + "",
      label: "Klasse " + minium,
    },
  ];
  for (let i = minium + 1; i <= maximum; i++) {
    options.push({
      value: i + "",
      label: "Klasse " + i,
    });
  }

  const handleSelectGrade = useCallback(
    (event) => {
      if (onSelectGrade) {
        onSelectGrade(Number(event.value));
      }
    },
    [onSelectGrade]
  );

  const value = options.find((o) => Number(o.value) === selectedGrade);

  return (
    <>
      <Select
        className={className}
        value={value}
        onChange={handleSelectGrade}
        placeholder={"Klassenstufe wählen"}
        instanceId={instanceId}
        id={id}
        isSearchable={false}
        options={options}
      />
    </>
  );
};
