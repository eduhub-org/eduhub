import { FC, useCallback } from "react";

interface IProps {
  name?: string;
  onChangeName?: (name: string) => any;

  grade?: number;

  studentsCount?: number;
  onChangeStudentsCount?: (studensCount: number) => any;

  className?: string;
}

export const SchoolClassEditor: FC<IProps> = ({
  name,
  onChangeName,
  grade,
  studentsCount,
  onChangeStudentsCount,

  className,
}) => {
  const renderDisabled = onChangeName == null || onChangeStudentsCount == null;

  const handleSelectName = useCallback(
    (event) => {
      const newName = event.target.value;
      if (onChangeName != null) {
        onChangeName(newName);
      }
    },
    [onChangeName]
  );

  const handleSelectStudentsCount = useCallback(
    (event) => {
      const newCount = Number(event.target.value);
      if (onChangeStudentsCount != null && !Number.isNaN(newCount)) {
        onChangeStudentsCount(newCount);
      }
    },
    [onChangeStudentsCount]
  );

  return (
    <>
      <div className={className || ""}>
        <div className="flex gap-3 mb-3 flex-col lg:flex-row">
          <span>Klassenbezeichner</span>
          <input
            className="border border-black"
            type="text"
            value={name || ""}
            disabled={renderDisabled}
            onChange={handleSelectName}
          />
          <span>Klassenstufe {grade || 1}</span>
          <span>Klassengröße</span>
          <input
            className="border border-black"
            type="number"
            min={0}
            max={100}
            value={studentsCount}
            onChange={handleSelectStudentsCount}
          />
        </div>
      </div>
    </>
  );
};
