import { IconButton } from "@material-ui/core";
import { ChangeEvent, FC, useCallback } from "react";

import DatePicker from "react-datepicker";
import { DebounceInput } from "react-debounce-input";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { MdCheckBox, MdCheckBoxOutlineBlank, MdDelete } from "react-icons/md";
import { ProgramList_Program } from "../../queries/__generated__/ProgramList";

interface ProgramsRowProps {
  program: ProgramList_Program;
  openProgramId: number;
  onSetVisibility: (p: ProgramList_Program, isVisible: boolean) => any;
  onSetTitle: (p: ProgramList_Program, title: string) => any;
  onSetShortTitle: (p: ProgramList_Program, shortTitle: string) => any;
  onSetApplicationStart: (p: ProgramList_Program, start: Date | null) => any;
  onSetApplicationEnd: (p: ProgramList_Program, end: Date | null) => any;
  onSetLectureStart: (p: ProgramList_Program, start: Date | null) => any;
  onSetLectureEnd: (p: ProgramList_Program, end: Date | null) => any;
  onSetUploadData: (p: ProgramList_Program, d: Date | null) => any;
  onDelete: (p: ProgramList_Program) => any;
  onOpenProgram: (p: ProgramList_Program) => any;
}

export const ProgramsRow: FC<ProgramsRowProps> = ({
  program,
  openProgramId,
  onSetApplicationEnd,
  onDelete,
  onOpenProgram,
  onSetApplicationStart,
  onSetLectureEnd,
  onSetLectureStart,
  onSetShortTitle,
  onSetTitle,
  onSetUploadData,
  onSetVisibility,
}) => {
  const handleToggleVisibility = useCallback(() => {
    onSetVisibility(program, !program.visibility);
  }, [program, onSetVisibility]);

  const handleSetTitle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSetTitle(program, event.target.value);
    },
    [program, onSetTitle]
  );

  const handleSetShortTitle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSetShortTitle(program, event.target.value);
    },
    [program, onSetShortTitle]
  );

  const handleSetApplicationStart = useCallback(
    (start: Date | null) => {
      onSetApplicationStart(program, start);
    },
    [program, onSetApplicationStart]
  );

  const handleSetApplicationEnd = useCallback(
    (end: Date | null) => {
      onSetApplicationEnd(program, end);
    },
    [program, onSetApplicationEnd]
  );

  const handleSetLectureStart = useCallback(
    (start: Date | null) => {
      onSetLectureStart(program, start);
    },
    [program, onSetLectureStart]
  );

  const handleSetLectureEnd = useCallback(
    (end: Date | null) => {
      onSetLectureEnd(program, end);
    },
    [program, onSetLectureEnd]
  );

  const handleSetUploadData = useCallback(
    (d: Date | null) => {
      onSetUploadData(program, d);
    },
    [program, onSetUploadData]
  );

  const handleOpenProgram = useCallback(() => {
    onOpenProgram(program);
  }, [program, onOpenProgram]);

  const handleDeleteProgram = useCallback(() => {
    onDelete(program);
  }, [program, onDelete]);

  return (
    <div>
      <div className="grid grid-cols-10 mb-1 bg-gray-100">
        <div
          className="flex justify-center cursor-pointer"
          onClick={handleToggleVisibility}
        >
          {!program.visibility && <MdCheckBoxOutlineBlank size="1.5em" />}
          {program.visibility && <MdCheckBox size="1.5em" />}
        </div>

        <div className="col-span-2">
          <DebounceInput
            className="w-full bg-gray-100"
            debounceTimeout={1000}
            value={program.title}
            onChange={handleSetTitle}
          />
        </div>

        <div>
          <DebounceInput
            className="w-full bg-gray-100"
            debounceTimeout={1000}
            value={program.shortTitle ?? ""}
            onChange={handleSetShortTitle}
          />
        </div>

        <div>
          <DatePicker
            className="w-full bg-gray-100"
            dateFormat={"dd/MM/yyyy"}
            selected={program.applicationStart || new Date()}
            onChange={handleSetApplicationStart}
          />
        </div>

        <div>
          <DatePicker
            dateFormat={"dd/MM/yyyy"}
            className="w-full bg-gray-100"
            selected={program.defaultApplicationEnd || new Date()}
            onChange={handleSetApplicationEnd}
          />
        </div>

        <div>
          <DatePicker
            dateFormat={"dd/MM/yyyy"}
            className="w-full bg-gray-100"
            selected={program.lectureStart || new Date()}
            onChange={handleSetLectureStart}
          />
        </div>

        <div>
          <DatePicker
            dateFormat={"dd/MM/yyyy"}
            className="w-full bg-gray-100"
            selected={program.lectureEnd || new Date()}
            onChange={handleSetLectureEnd}
          />
        </div>

        <div>
          <DatePicker
            dateFormat={"dd/MM/yyyy"}
            className="w-full bg-gray-100"
            selected={program.projectRecordUploadDeadline || new Date()}
            onChange={handleSetUploadData}
          />
        </div>

        <div className="grid grid-cols-2">
          <div>
            <IconButton onClick={handleOpenProgram}>
              {openProgramId !== program.id ? (
                <IoIosArrowDown size="0.75em" />
              ) : (
                <IoIosArrowUp size="0.75em" />
              )}
            </IconButton>
          </div>

          <div>
            <IconButton onClick={handleDeleteProgram}>
              <MdDelete size="0.75em" />
            </IconButton>
          </div>
        </div>
      </div>

      {program.id === openProgramId && <div>TEST Opened a program!</div>}
    </div>
  );
};
