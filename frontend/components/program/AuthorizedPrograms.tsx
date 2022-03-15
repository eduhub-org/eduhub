import Head from "next/head";
import Link from "next/link";
import { FC, useCallback, useState } from "react";
import DatePicker from "react-datepicker";
import { DebounceInput } from "react-debounce-input";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import {
  MdAddCircle,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdDelete,
} from "react-icons/md";

import { Page } from "../../components/Page";
import { OnlyAdmin, OnlyNotAdmin } from "../../components/common/OnlyLoggedIn";
import { PageBlock } from "../../components/common/PageBlock";
import { QuestionConfirmationDialog } from "../../components/common/QuestionConfirmationDialog";
import { useAdminMutation } from "../../hooks/authedMutation";
import { useAdminQuery } from "../../hooks/authedQuery";

import {
  ProgramList,
  ProgramList_Program,
} from "../../queries/__generated__/ProgramList";
import { PROGRAM_LIST } from "../../queries/programList";
import "react-datepicker/dist/react-datepicker.css";
import {
  UpdateProgramVisibility,
  UpdateProgramVisibilityVariables,
} from "../../queries/__generated__/UpdateProgramVisibility";
import {
  DELETE_PROGRAM,
  INSERT_PROGRAM,
  UPDATE_ClOSING_QUESTIONAIRE,
  UPDATE_PROGRAM_ACHIEVEMENT_CERT_VISIBLE,
  UPDATE_PROGRAM_APPLICATION_END,
  UPDATE_PROGRAM_APPLICATION_START,
  UPDATE_PROGRAM_LECTURE_END,
  UPDATE_PROGRAM_LECTURE_START,
  UPDATE_PROGRAM_PARTICIPATION_CERT_VISIBLE,
  UPDATE_PROGRAM_SHORT_TITLE,
  UPDATE_PROGRAM_TITLE,
  UPDATE_PROGRAM_UPLOAD_DEADLINE,
  UPDATE_PROGRAM_VISIBILITY,
  UPDATE_SPEAKER_QUESTIONAIRE,
  UPDATE_START_QUESTIONAIRE,
} from "../../queries/updateProgram";
import {
  UpdateProgramTitle,
  UpdateProgramTitleVariables,
} from "../../queries/__generated__/UpdateProgramTitle";
import {
  UpdateProgramShortTitle,
  UpdateProgramShortTitleVariables,
} from "../../queries/__generated__/UpdateProgramShortTitle";
import {
  UpdateProgramApplicationStart,
  UpdateProgramApplicationStartVariables,
} from "../../queries/__generated__/UpdateProgramApplicationStart";
import {
  UpdateProgramApplicationEnd,
  UpdateProgramApplicationEndVariables,
} from "../../queries/__generated__/UpdateProgramApplicationEnd";
import {
  UpdateProgramLectureStart,
  UpdateProgramLectureStartVariables,
} from "../../queries/__generated__/UpdateProgramLectureStart";
import {
  UpdateProgramLectureEnd,
  UpdateProgramLectureEndVariables,
} from "../../queries/__generated__/UpdateProgramLectureEnd";
import {
  UpdateProgramUploadDeadline,
  UpdateProgramUploadDeadlineVariables,
} from "../../queries/__generated__/UpdateProgramUploadDeadline";

import { Button } from "@material-ui/core";

import {
  InsertProgram,
  InsertProgramVariables,
} from "../../queries/__generated__/InsertProgram";
import {
  DeleteProgram,
  DeleteProgramVariables,
} from "../../queries/__generated__/DeleteProgram";
import { ProgramsRow } from "./ProgramsRow";
import { UpdateProgramStartQuestionaire, UpdateProgramStartQuestionaireVariables } from "../../queries/__generated__/UpdateProgramStartQuestionaire";
import { UpdateProgramSpeakerQuestionaire } from "../../queries/__generated__/UpdateProgramSpeakerQuestionaire";
import { UpdateProgramClosingQuestionaire, UpdateProgramClosingQuestionaireVariables } from "../../queries/__generated__/UpdateProgramClosingQuestionaire";
import { UpdateProgramAchievementCertVisible, UpdateProgramAchievementCertVisibleVariables } from "../../queries/__generated__/UpdateProgramAchievementCertVisible";
import { UpdateProgramParticipationCertVisible, UpdateProgramParticipationCertVisibleVariables } from "../../queries/__generated__/UpdateProgramParticipationCertVisible";

export const AuthorizedPrograms: FC = () => {
  const qResult = useAdminQuery<ProgramList>(PROGRAM_LIST);

  if (qResult.error) {
    console.log("query programs error", qResult.error);
  }

  const ps = [...(qResult.data?.Program || [])];
  ps.sort((a, b) => {
    return b.id - a.id;
  });

  const programs = ps;

  const [openProgram, setOpenProgram] = useState(-1);

  const [insertProgram] = useAdminMutation<
    InsertProgram,
    InsertProgramVariables
  >(INSERT_PROGRAM);
  const insertDefaultProgram = useCallback(async () => {
    const today = new Date();
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    await insertProgram({
      variables: {
        title: "Programmtitel festlegen",
        today: new Date(),
      },
    });
    qResult.refetch();
  }, [qResult, insertProgram]);

  const [deleteProgramMutation] = useAdminMutation<
    DeleteProgram,
    DeleteProgramVariables
  >(DELETE_PROGRAM);
  const deleteProgram = useCallback(
    async (p: ProgramList_Program) => {
      await deleteProgramMutation({
        variables: {
          programId: p.id,
        },
      });
      qResult.refetch();
    },
    [qResult, deleteProgramMutation]
  );

  const [updateVisibility] = useAdminMutation<
    UpdateProgramVisibility,
    UpdateProgramVisibilityVariables
  >(UPDATE_PROGRAM_VISIBILITY);
  const setProgramVisibility = useCallback(
    async (p: ProgramList_Program, isVisible: boolean) => {
      await updateVisibility({
        variables: {
          programId: p.id,
          visible: isVisible,
        },
      });
      qResult.refetch();
    },
    [qResult, updateVisibility]
  );

  const [updateTitle] = useAdminMutation<
    UpdateProgramTitle,
    UpdateProgramTitleVariables
  >(UPDATE_PROGRAM_TITLE);
  const handleProgramTitle = useCallback(
    async (p: ProgramList_Program, title: string) => {
      await updateTitle({
        variables: {
          programId: p.id,
          title,
        },
      });
      qResult.refetch();
    },
    [qResult, updateTitle]
  );

  const [updateShortTitle] = useAdminMutation<
    UpdateProgramShortTitle,
    UpdateProgramShortTitleVariables
  >(UPDATE_PROGRAM_SHORT_TITLE);
  const handleProgramShortTitle = useCallback(
    async (p: ProgramList_Program, shortTitle: string) => {
      await updateShortTitle({
        variables: {
          programId: p.id,
          shortTitle,
        },
      });
      qResult.refetch();
    },
    [qResult, updateShortTitle]
  );

  const [updateApplicationStart] = useAdminMutation<
    UpdateProgramApplicationStart,
    UpdateProgramApplicationStartVariables
  >(UPDATE_PROGRAM_APPLICATION_START);
  const handleApplicationStart = useCallback(
    async (p: ProgramList_Program, applicationStart: Date | null) => {
      if (applicationStart != null) {
        await updateApplicationStart({
          variables: {
            programId: p.id,
            applicationStart,
          },
        });

        qResult.refetch();
      }
    },
    [qResult, updateApplicationStart]
  );

  const [updateApplicationEnd] = useAdminMutation<
    UpdateProgramApplicationEnd,
    UpdateProgramApplicationEndVariables
  >(UPDATE_PROGRAM_APPLICATION_END);
  const handleApplicationEnd = useCallback(
    async (p: ProgramList_Program, applicationEnd: Date | null) => {
      if (applicationEnd != null) {
        await updateApplicationEnd({
          variables: {
            programId: p.id,
            applicationEnd,
          },
        });

        qResult.refetch();
      }
    },
    [qResult, updateApplicationEnd]
  );

  const [updateLectureStart] = useAdminMutation<
    UpdateProgramLectureStart,
    UpdateProgramLectureStartVariables
  >(UPDATE_PROGRAM_LECTURE_START);
  const handleLectureStart = useCallback(
    async (p: ProgramList_Program, lectureStart: Date | null) => {
      if (lectureStart != null) {
        await updateLectureStart({
          variables: {
            programId: p.id,
            lectureStart,
          },
        });
        qResult.refetch();
      }
    },
    [qResult, updateLectureStart]
  );

  const [updateLectureEnd] = useAdminMutation<
    UpdateProgramLectureEnd,
    UpdateProgramLectureEndVariables
  >(UPDATE_PROGRAM_LECTURE_END);
  const handleLectureEnd = useCallback(
    async (p: ProgramList_Program, lectureEnd: Date | null) => {
      if (lectureEnd != null) {
        await updateLectureEnd({
          variables: {
            programId: p.id,
            lectureEnd,
          },
        });
        qResult.refetch();
      }
    },
    [qResult, updateLectureEnd]
  );

  const [updateUploadDeadline] = useAdminMutation<
    UpdateProgramUploadDeadline,
    UpdateProgramUploadDeadlineVariables
  >(UPDATE_PROGRAM_UPLOAD_DEADLINE);
  const handleUploadDeadline = useCallback(
    async (p: ProgramList_Program, deadline: Date | null) => {
      if (deadline != null) {
        await updateUploadDeadline({
          variables: {
            programId: p.id,
            deadline,
          },
        });
        qResult.refetch();
      }
    },
    [qResult, updateUploadDeadline]
  );

  const [updateStartQuestionaire] = useAdminMutation<
      UpdateProgramStartQuestionaire,
      UpdateProgramStartQuestionaireVariables
    >(UPDATE_START_QUESTIONAIRE);
  
  const handleStartQuestionaire = useCallback(
    async (p: ProgramList_Program, link: string) => {
      await updateStartQuestionaire({
        variables: {
          programId: p.id,
          questionaire: link
        }
      });
      qResult.refetch();
    },
    [qResult, updateStartQuestionaire]
  );

  const [updateSpeakerQuestionaire] = useAdminMutation<
    UpdateProgramSpeakerQuestionaire,
    UpdateProgramStartQuestionaireVariables
  >(UPDATE_SPEAKER_QUESTIONAIRE);

  const handleSpeakerQuestionaire = useCallback(
    async (p: ProgramList_Program, link: string) => {
      await updateSpeakerQuestionaire({
        variables: {
          programId: p.id,
          questionaire: link
        }
      });
      qResult.refetch();
    },
    [qResult, updateSpeakerQuestionaire]
  );

  const [updateClosingQuestionaire] = useAdminMutation<
      UpdateProgramClosingQuestionaire,
      UpdateProgramClosingQuestionaireVariables
    >(UPDATE_ClOSING_QUESTIONAIRE);
  const handleClosingQuestionaire = useCallback(
    async (p: ProgramList_Program, link: string) => {
      await updateClosingQuestionaire({
        variables: {
          programId: p.id,
          questionaire: link
        }
      });
      qResult.refetch();
    },
    [qResult, updateClosingQuestionaire]
  );

  const [updateProgramAchievementCertVisible] = useAdminMutation<
    UpdateProgramAchievementCertVisible,
    UpdateProgramAchievementCertVisibleVariables
  >(UPDATE_PROGRAM_ACHIEVEMENT_CERT_VISIBLE);
  const handleProgramAchivementCertVisible = useCallback(
    async (p: ProgramList_Program, isVisible: boolean) => {
      await updateProgramAchievementCertVisible({
        variables: {
          programId: p.id,
          isVisible
        }
      });
      qResult.refetch();
    },
    [qResult, updateProgramAchievementCertVisible]
  );

  const [updateProgramParticipationCertVisible] = useAdminMutation<
    UpdateProgramParticipationCertVisible,
    UpdateProgramParticipationCertVisibleVariables
  >(UPDATE_PROGRAM_PARTICIPATION_CERT_VISIBLE);
  const handleProgramParticipationCertVisible = useCallback(
    async (p: ProgramList_Program, isVisible: boolean) => {
      await updateProgramParticipationCertVisible({
        variables: {
          programId: p.id,
          isVisible
        }
      });
      qResult.refetch();
    },
    [qResult, updateProgramParticipationCertVisible]
  );


  const [
    activeDialogProgram,
    setActiveDialogProgram,
  ] = useState<ProgramList_Program | null>(null);

  const [confirmMakeVisibleOpen, setConfirmMakeVisibleOpen] = useState(false);
  const handleMakeVisibleDialogClose = useCallback(
    (confirm: boolean) => {
      if (confirm && activeDialogProgram != null) {
        setProgramVisibility(activeDialogProgram, true);
      }
      setConfirmMakeVisibleOpen(false);
    },
    [activeDialogProgram, setProgramVisibility, setConfirmMakeVisibleOpen]
  );

  const [confirmMakeInvisibleOpen, setConfirmMakeInvisibleOpen] = useState(
    false
  );
  const handleMakeInvisibleDialogClose = useCallback(
    (confirm: boolean) => {
      if (confirm && activeDialogProgram != null) {
        setProgramVisibility(activeDialogProgram, false);
      }
      setConfirmMakeInvisibleOpen(false);
    },
    [activeDialogProgram, setProgramVisibility, setConfirmMakeInvisibleOpen]
  );

  const [confirmDeleteProgramOpen, setConfirmDeleteProgramOpen] = useState(
    false
  );
  const handleConfirmDeleteProgramClose = useCallback(
    (confirm: boolean) => {
      if (confirm && activeDialogProgram != null) {
        deleteProgram(activeDialogProgram);
      }
      setConfirmDeleteProgramOpen(false);
    },
    [activeDialogProgram, deleteProgram, setConfirmDeleteProgramOpen]
  );

  const handleToggleVisibility = useCallback(
    (v: ProgramList_Program, isVisible: boolean) => {
      setActiveDialogProgram(v);
      if (!isVisible) {
        setConfirmMakeInvisibleOpen(true);
      } else {
        setConfirmMakeVisibleOpen(true);
      }
    },
    [
      setActiveDialogProgram,
      setConfirmMakeInvisibleOpen,
      setConfirmMakeVisibleOpen,
    ]
  );

  const handleDelete = useCallback(
    (v: ProgramList_Program) => {
      setActiveDialogProgram(v);
      setConfirmDeleteProgramOpen(true);
    },
    [setActiveDialogProgram, setConfirmDeleteProgramOpen]
  );

  const handleOpenProgram = useCallback(
    (v: ProgramList_Program) => {
      setOpenProgram(openProgram !== v.id ? v.id : -1);
    },
    [setOpenProgram, openProgram]
  );

  return (
    <>
      <PageBlock>
        <div className="flex flex-row mb-12">
          <h1 className="text-4xl font-bold">Programme</h1>
        </div>
        <div className="flex justify-end mb-12">
          <Button onClick={insertDefaultProgram} startIcon={<MdAddCircle />}>
            Programm hinzufügen
          </Button>
        </div>
        <div className="grid grid-cols-10">
          <div>Veröff.</div>
          <div className="col-span-2">Programmtitel</div>
          <div>Kurztitel</div>
          <div>Bew. Start</div>
          <div>Bew. Ende</div>
          <div>Start</div>
          <div>Ende</div>
          <div>Abgabe Frist</div>
          <div>&nbsp;</div>
        </div>
        {programs != null &&
          programs.length > 0 &&
          programs.map((v, i) => (
            <ProgramsRow
              key={v.id}
              program={v}
              canDelete={v.Courses.length === 0}
              openProgramId={openProgram}
              onSetVisibility={handleToggleVisibility}
              onSetTitle={handleProgramTitle}
              onSetShortTitle={handleProgramShortTitle}
              onSetApplicationStart={handleApplicationStart}
              onSetApplicationEnd={handleApplicationEnd}
              onSetLectureStart={handleLectureStart}
              onSetLectureEnd={handleLectureEnd}
              onSetUploadData={handleUploadDeadline}
              onDelete={handleDelete}
              onOpenProgram={handleOpenProgram}
              onSetStartQuestionaire={handleStartQuestionaire}
              onSetClosingQuestionaire={handleClosingQuestionaire}
              onSetSpeakerQuestionaire={handleSpeakerQuestionaire}
              onSetVisibilityParticipationCertificate={handleProgramParticipationCertVisible}
              onSetVisiblityAchievementCertificate={handleProgramAchivementCertVisible}
            />
          ))}
        <div className="flex justify-end mt-12 mb-12">
          <Button onClick={insertDefaultProgram} startIcon={<MdAddCircle />}>
            Programm hinzufügen
          </Button>
        </div>
      </PageBlock>
      <QuestionConfirmationDialog
        question={`Möchtest du das Programm "${activeDialogProgram?.title}" wirklich veröffentlichen?`}
        confirmationText={"Veröffentlichen"}
        onClose={handleMakeVisibleDialogClose}
        open={confirmMakeVisibleOpen}
      />
      <QuestionConfirmationDialog
        question={`Möchtest du die Veröffentlichung des Programmes "${activeDialogProgram?.title}" wirklich zurücknehmen?`}
        confirmationText={"Zurücknehmen"}
        onClose={handleMakeInvisibleDialogClose}
        open={confirmMakeInvisibleOpen}
      />
      <QuestionConfirmationDialog
        question={`Möchtest du das Programm "${activeDialogProgram?.title}" wirklich löschen?`}
        confirmationText={"Löschen"}
        onClose={handleConfirmDeleteProgramClose}
        open={confirmDeleteProgramOpen}
      />
    </>
  );
};
