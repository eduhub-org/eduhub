import { FC, useCallback } from "react";

interface IProps {
  name?: string;
  onChangeName?: (name: string) => any;

  grade?: number;
  
  contact?: string;
  onChangeContact?: (contact: string) => any;

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

  contact,
  onChangeContact,

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

    const handleSelectContact = useCallback(
      (event) => {
        const newContact = event.target.value;
        if (onChangeContact != null) {
          onChangeContact(newContact)
        }
      },
      [onChangeContact]
    );

  return (
    <>
      <div className={className || ""}>
        <div className="flex gap-3 mb-1 flex-col lg:flex-row">
          <span className="w-36">Klassenbezeichner</span>
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
        <div className="flex gap-3 mb-3 flex-col lg:flex-row">
          <span className="w-36">Kontakt (Telefon)</span>
          <input 
            className="border border-black"
            type="text"
            value={contact || ""}
            disabled={renderDisabled}
            onChange={handleSelectContact}
          />
        </div>
      </div>
    </>
  );
};
