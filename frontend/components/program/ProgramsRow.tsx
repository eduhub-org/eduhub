import { QueryResult } from "@apollo/client";
import { IconButton } from "@material-ui/core";
import { ChangeEvent, FC, MutableRefObject, useCallback, useRef } from "react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DebounceInput } from "react-debounce-input";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdDelete,
  MdOutlineCheckBoxOutlineBlank,
  MdUpload,
} from "react-icons/md";
import { parseFileUploadEvent } from "../../helpers/filehandling";
import { useAdminMutation } from "../../hooks/authedMutation";
import {
  SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE,
  SAVE_PARTICIPATION_CERTIFICATE_TEMPLATE,
} from "../../queries/actions";
import {
  UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE,
  UPDATE_PARTICIPATION_CERTIFICATE_TEMPLATE,
} from "../../queries/updateProgram";
import { ProgramList_Program } from "../../queries/__generated__/ProgramList";
import {
  SaveAchievementCertificateTemplate,
  SaveAchievementCertificateTemplateVariables,
} from "../../queries/__generated__/SaveAchievementCertificateTemplate";
import {
  SaveParticipationCertificateTemplate,
  SaveParticipationCertificateTemplateVariables,
} from "../../queries/__generated__/SaveParticipationCertificateTemplate";

import {
  UpdateProgramAchievementTemplate,
  UpdateProgramAchievementTemplateVariables,
} from "../../queries/__generated__/UpdateProgramAchievementTemplate";
import {
  UpdateProgramParticipationTemplate,
  UpdateProgramParticipationTemplateVariables,
} from "../../queries/__generated__/UpdateProgramParticipationTemplate";
import EhDebounceInput from "../common/EhDebounceInput";

interface ProgramsRowProps {
  program: ProgramList_Program;
  openProgramId: number;
  canDelete: boolean;
  qResult: QueryResult<any>;
  onSetVisibility: (p: ProgramList_Program, isVisible: boolean) => any;
  onSetTitle: (p: ProgramList_Program, title: string) => any;
  onSetShortTitle: (p: ProgramList_Program, shortTitle: string) => any;
  onSetApplicationStart: (p: ProgramList_Program, start: Date | null) => any;
  onSetApplicationEnd: (p: ProgramList_Program, end: Date | null) => any;
  onSetLectureStart: (p: ProgramList_Program, start: Date | null) => any;
  onSetLectureEnd: (p: ProgramList_Program, end: Date | null) => any;
  onSetUploadData: (p: ProgramList_Program, d: Date | null) => any;
  onSetStartQuestionaire: (p: ProgramList_Program, link: string) => any;
  onSetSpeakerQuestionaire: (p: ProgramList_Program, link: string) => any;
  onSetClosingQuestionaire: (p: ProgramList_Program, link: string) => any;
  onSetVisibilityParticipationCertificate: (
    p: ProgramList_Program,
    isVisible: boolean
  ) => any;
  onSetVisiblityAchievementCertificate: (
    p: ProgramList_Program,
    isVisible: boolean
  ) => any;
  onDelete: (p: ProgramList_Program) => any;
  onOpenProgram: (p: ProgramList_Program) => any;
}

export const ProgramsRow: FC<ProgramsRowProps> = ({
  program,
  openProgramId,
  canDelete,
  qResult,
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
  onSetStartQuestionaire,
  onSetSpeakerQuestionaire,
  onSetClosingQuestionaire,
  onSetVisibilityParticipationCertificate,
  onSetVisiblityAchievementCertificate,
}) => {
  const handleToggleVisibilityParticipationCertificate = useCallback(() => {
    onSetVisibilityParticipationCertificate(
      program,
      !program.visibilityParticipationCertificate
    );
  }, [program, onSetVisibilityParticipationCertificate]);

  const handleToggleVisibilityAchievementCertificate = useCallback(() => {
    onSetVisiblityAchievementCertificate(
      program,
      !program.visibilityAchievementCertificate
    );
  }, [program, onSetVisiblityAchievementCertificate]);

  const handleToggleVisibility = useCallback(() => {
    onSetVisibility(program, !program.visibility);
  }, [program, onSetVisibility]);

  const handleSetStartQuestionaire = useCallback(
    (value: string) => {
      onSetStartQuestionaire(program, value);
    },
    [program, onSetStartQuestionaire]
  );

  const handleSetSpeakerQuestionaire = useCallback(
    (value: string) => {
      onSetSpeakerQuestionaire(program, value);
    },
    [program, onSetSpeakerQuestionaire]
  );

  const handleSetClosingQuestionaire = useCallback(
    (value: string) => {
      onSetClosingQuestionaire(program, value);
    },
    [program, onSetClosingQuestionaire]
  );

  const handleSetTitle = useCallback(
    (value: string) => {
      onSetTitle(program, value);
    },
    [program, onSetTitle]
  );

  const handleSetShortTitle = useCallback(
    (value: string) => {
      onSetShortTitle(program, value);
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

  const templateUploadInputRef: MutableRefObject<any> = useRef(null);
  const handleUploadTemplateParticipationClick = useCallback(() => {
    templateUploadInputRef.current?.click();
  }, [templateUploadInputRef]);

  const [saveParticipationCertificateTemplate] = useAdminMutation<
    SaveParticipationCertificateTemplate,
    SaveParticipationCertificateTemplateVariables
  >(SAVE_PARTICIPATION_CERTIFICATE_TEMPLATE);

  const [updateParticipationTemplate] = useAdminMutation<
    UpdateProgramParticipationTemplate,
    UpdateProgramParticipationTemplateVariables
  >(UPDATE_PARTICIPATION_CERTIFICATE_TEMPLATE);

  const handleTemplateParticipationUploadEvent = useCallback(
    async (event: any) => {
      const ufile = await parseFileUploadEvent(event);

      if (ufile != null) {
        const respone = await saveParticipationCertificateTemplate({
          variables: {
            base64File: ufile.data,
            fileName: ufile.name,
            programId: program.id,
          },
        });
        if (respone.data?.saveParticipationCertificateTemplate?.link) {
          await updateParticipationTemplate({
            variables: {
              programId: program.id,
              templatePath:
                respone.data?.saveParticipationCertificateTemplate?.link,
            },
          });

          qResult.refetch();
        }
      }
    },
    [
      saveParticipationCertificateTemplate,
      qResult,
      updateParticipationTemplate,
      program,
    ]
  );

  const templateAchivementUploadRef: MutableRefObject<any> = useRef(null);
  const handleUploadAchivementTemplateClick = useCallback(() => {
    templateAchivementUploadRef.current?.click();
  }, [templateAchivementUploadRef]);

  const [saveAchievementCertificateTemplate] = useAdminMutation<
    SaveAchievementCertificateTemplate,
    SaveAchievementCertificateTemplateVariables
  >(SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE);

  const [updateAchievementCertificationTemplate] = useAdminMutation<
    UpdateProgramAchievementTemplate,
    UpdateProgramAchievementTemplateVariables
  >(UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE);

  const handleTemplateAchivementUploadEvent = useCallback(
    async (event: any) => {
      const ufile = await parseFileUploadEvent(event);
      if (ufile != null) {
        const response = await saveAchievementCertificateTemplate({
          variables: {
            base64File: ufile.data,
            fileName: ufile.name,
            programId: program.id,
          },
        });

        if (response.data?.saveAchievementCertificateTemplate?.link) {
          await updateAchievementCertificationTemplate({
            variables: {
              programId: program.id,
              templatePath:
                response.data?.saveAchievementCertificateTemplate?.link,
            },
          });

          qResult.refetch();
        }
      }
    },
    [
      saveAchievementCertificateTemplate,
      qResult,
      updateAchievementCertificationTemplate,
      program,
    ]
  );

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
          <EhDebounceInput
            placeholder="Programmtitel setzen"
            onChangeHandler={handleSetTitle}
            inputText={program.title}
          />
        </div>

        <div>
          <EhDebounceInput
            placeholder="Kurztitel setzen"
            onChangeHandler={handleSetShortTitle}
            inputText={program.shortTitle ?? ""}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            className="w-full bg-gray-100"
            dateFormat={"dd/MM/yyyy"}
            selected={program.applicationStart || new Date()}
            onChange={handleSetApplicationStart}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            dateFormat={"dd/MM/yyyy"}
            className="w-full bg-gray-100"
            selected={program.defaultApplicationEnd || new Date()}
            onChange={handleSetApplicationEnd}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            dateFormat={"dd/MM/yyyy"}
            className="w-full bg-gray-100"
            selected={program.lectureStart || new Date()}
            onChange={handleSetLectureStart}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            dateFormat={"dd/MM/yyyy"}
            className="w-full bg-gray-100"
            selected={program.lectureEnd || new Date()}
            onChange={handleSetLectureEnd}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
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

          {canDelete && (
            <div>
              <IconButton onClick={handleDeleteProgram}>
                <MdDelete size="0.75em" />
              </IconButton>
            </div>
          )}
        </div>
      </div>

      {program.id === openProgramId && (
        <div className="mb-1">
          <div className="grid grid-cols-3 bg-gray-100 p-10">
            <div className="p-3">
              <span>Link Start-Evaluation</span>
              <br />
              <EhDebounceInput
                placeholder="URL eintragen"
                onChangeHandler={handleSetStartQuestionaire}
                inputText={program.startQuestionnaire || ""}
              />
            </div>
            <div className="p-3">
              <span>Link Speaker-Evaluation</span>
              <br />
              <EhDebounceInput
                placeholder="URL eintragen"
                onChangeHandler={handleSetSpeakerQuestionaire}
                inputText={program.speakerQuestionnaire || ""}
              />
            </div>
            <div className="p-3">
              <span>Link Abschluss-Evaluation</span>
              <br />
              <EhDebounceInput
                placeholder="URL eintragen"
                onChangeHandler={handleSetClosingQuestionaire}
                inputText={program.closingQuestionnaire || ""}
              />
            </div>

            <div className="p-3">
              Template Teilnahmenachweis
              <IconButton onClick={handleUploadTemplateParticipationClick}>
                <MdUpload size="0.75em" />
              </IconButton>
              <br />
              <div className="w-80 truncate">
                {program.participationCertificateTemplateURL ||
                  "Noch kein Template hochgeladen"}
              </div>
              <input
                ref={templateUploadInputRef}
                onChange={handleTemplateParticipationUploadEvent}
                className="hidden"
                type="file"
              />
            </div>
            <div className="p-3">
              Template Leistungszertifiat
              <IconButton onClick={handleUploadAchivementTemplateClick}>
                <MdUpload size="0.75em" />
              </IconButton>
              <br />
              <div className="w-80 truncate">
                {program.attendanceCertificateTemplateURL ||
                  "Noch kein Template hochgeladen"}
              </div>
              <input
                ref={templateAchivementUploadRef}
                onChange={handleTemplateAchivementUploadEvent}
                className="hidden"
                type="file"
              />
            </div>
            <div className="p-3">
              Bescheinigungen einblenden:
              <div className="grid grid-cols-10">
                <div
                  className="cursor-pointer"
                  onClick={handleToggleVisibilityParticipationCertificate}
                >
                  {program.visibilityParticipationCertificate && (
                    <MdCheckBox size="1.5em" />
                  )}
                  {!program.visibilityParticipationCertificate && (
                    <MdOutlineCheckBoxOutlineBlank size="1.5em" />
                  )}
                </div>
                <div className="col-span-9">Teilnahmenachweis</div>
              </div>
              <div className="grid grid-cols-10">
                <div
                  className="cursor-pointer"
                  onClick={handleToggleVisibilityAchievementCertificate}
                >
                  {program.visibilityAchievementCertificate && (
                    <MdCheckBox size="1.5em" />
                  )}
                  {!program.visibilityAchievementCertificate && (
                    <MdOutlineCheckBoxOutlineBlank size="1.5em" />
                  )}
                </div>
                <div className="col-span-9">Leistungszertifikat</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
