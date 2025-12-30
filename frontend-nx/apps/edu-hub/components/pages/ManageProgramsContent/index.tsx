import { FC, useCallback, useState } from 'react';
import { MdAddCircle } from 'react-icons/md';

import { PageBlock } from '../../common/PageBlock';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery } from '../../../hooks/authedQuery';

import { ProgramList, ProgramList_Program } from '../../../queries/__generated__/ProgramList';
import { PROGRAM_LIST } from '../../../queries/programList';
import 'react-datepicker/dist/react-datepicker.css';
import {
  UpdateProgramPublished,
  UpdateProgramPublishedVariables,
} from '../../../queries/__generated__/UpdateProgramPublished';
import {
  INSERT_PROGRAM,
  UPDATE_PROGRAM_ACHIEVEMENT_CERT_VISIBLE,
  UPDATE_PROGRAM_APPLICATION_END,
  UPDATE_PROGRAM_APPLICATION_START,
  UPDATE_PROGRAM_LECTURE_END,
  UPDATE_PROGRAM_LECTURE_START,
  UPDATE_PROGRAM_PARTICIPATION_CERT_VISIBLE,
  UPDATE_PROGRAM_UPLOAD_DEADLINE,
  UPDATE_PROGRAM_PUBLISHED,
} from '../../../queries/updateProgram';
import {
  UpdateProgramApplicationStart,
  UpdateProgramApplicationStartVariables,
} from '../../../queries/__generated__/UpdateProgramApplicationStart';
import {
  UpdateProgramApplicationEnd,
  UpdateProgramApplicationEndVariables,
} from '../../../queries/__generated__/UpdateProgramApplicationEnd';
import {
  UpdateProgramLectureStart,
  UpdateProgramLectureStartVariables,
} from '../../../queries/__generated__/UpdateProgramLectureStart';
import {
  UpdateProgramLectureEnd,
  UpdateProgramLectureEndVariables,
} from '../../../queries/__generated__/UpdateProgramLectureEnd';
import {
  UpdateProgramUploadDeadline,
  UpdateProgramUploadDeadlineVariables,
} from '../../../queries/__generated__/UpdateProgramUploadDeadline';

import { Button } from '@mui/material';

import { InsertProgram, InsertProgramVariables } from '../../../queries/__generated__/InsertProgram';
import { ProgramsRow } from './ProgramsRow';
import {
  UpdateProgramAchievementCertVisible,
  UpdateProgramAchievementCertVisibleVariables,
} from '../../../queries/__generated__/UpdateProgramAchievementCertVisible';
import {
  UpdateProgramParticipationCertVisible,
  UpdateProgramParticipationCertVisibleVariables,
} from '../../../queries/__generated__/UpdateProgramParticipationCertVisible';
import { useTranslations, useLocale } from 'next-intl';

export const ManageProgramsContent: FC = () => {
  const t = useTranslations();
  const qResult = useAdminQuery<ProgramList>(PROGRAM_LIST);

  if (qResult.error) {
    console.log('query programs error', qResult.error);
  }

  const ps = [...(qResult.data?.Program || [])];
  ps.sort((a, b) => {
    return b.id - a.id;
  });

  const programs = ps;

  const [openProgram, setOpenProgram] = useState(-1);

  const [insertProgram] = useAdminMutation<InsertProgram, InsertProgramVariables>(INSERT_PROGRAM);
  const insertDefaultProgram = useCallback(async () => {
    const today = new Date();
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    await insertProgram({
      variables: {
        title: t('table.default_title'),
        today: new Date(),
      },
    });
    qResult.refetch();
  }, [insertProgram, t, qResult]);

  const [updatePublished] = useAdminMutation<UpdateProgramPublished, UpdateProgramPublishedVariables>(
    UPDATE_PROGRAM_PUBLISHED
  );
  const setProgramPublished = useCallback(
    async (p: ProgramList_Program, isPublished: boolean) => {
      await updatePublished({
        variables: {
          programId: p.id,
          published: isPublished,
        },
      });
      qResult.refetch();
    },
    [qResult, updatePublished]
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

  const [updateApplicationEnd] = useAdminMutation<UpdateProgramApplicationEnd, UpdateProgramApplicationEndVariables>(
    UPDATE_PROGRAM_APPLICATION_END
  );
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

  const [updateLectureStart] = useAdminMutation<UpdateProgramLectureStart, UpdateProgramLectureStartVariables>(
    UPDATE_PROGRAM_LECTURE_START
  );
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

  const [updateLectureEnd] = useAdminMutation<UpdateProgramLectureEnd, UpdateProgramLectureEndVariables>(
    UPDATE_PROGRAM_LECTURE_END
  );
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

  const [updateUploadDeadline] = useAdminMutation<UpdateProgramUploadDeadline, UpdateProgramUploadDeadlineVariables>(
    UPDATE_PROGRAM_UPLOAD_DEADLINE
  );
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

  const [updateProgramAchievementCertVisible] = useAdminMutation<
    UpdateProgramAchievementCertVisible,
    UpdateProgramAchievementCertVisibleVariables
  >(UPDATE_PROGRAM_ACHIEVEMENT_CERT_VISIBLE);
  const handleProgramAchievementCertVisible = useCallback(
    async (p: ProgramList_Program, isVisible: boolean) => {
      await updateProgramAchievementCertVisible({
        variables: {
          programId: p.id,
          isVisible,
        },
      });
      qResult.refetch();
    },
    [qResult, updateProgramAchievementCertVisible]
  );

  const [updateProgramParticipationCertVisible] = useAdminMutation<
    UpdateProgramParticipationCertVisible,
    UpdateProgramParticipationCertVisibleVariables
  >(UPDATE_PROGRAM_PARTICIPATION_CERT_VISIBLE);
  const handleProgramAttendanceCertificateVisible = useCallback(
    async (p: ProgramList_Program, isVisible: boolean) => {
      await updateProgramParticipationCertVisible({
        variables: {
          programId: p.id,
          isVisible,
        },
      });
      qResult.refetch();
    },
    [qResult, updateProgramParticipationCertVisible]
  );

  const [activeDialogProgram, setActiveDialogProgram] = useState<ProgramList_Program | null>(null);

  const [confirmMakeVisibleOpen, setConfirmMakeVisibleOpen] = useState(false);
  const handleMakeVisibleDialogClose = useCallback(
    (confirm: boolean) => {
      if (confirm && activeDialogProgram != null) {
        setProgramPublished(activeDialogProgram, true);
      }
      setConfirmMakeVisibleOpen(false);
    },
    [activeDialogProgram, setProgramPublished, setConfirmMakeVisibleOpen]
  );

  const [confirmMakeInvisibleOpen, setConfirmMakeInvisibleOpen] = useState(false);
  const handleMakeInvisibleDialogClose = useCallback(
    (confirm: boolean) => {
      if (confirm && activeDialogProgram != null) {
        setProgramPublished(activeDialogProgram, false);
      }
      setConfirmMakeInvisibleOpen(false);
    },
    [activeDialogProgram, setProgramPublished, setConfirmMakeInvisibleOpen]
  );

  const handleTogglePublished = useCallback(
    (v: ProgramList_Program, isPublished: boolean) => {
      setActiveDialogProgram(v);
      if (!isPublished) {
        setConfirmMakeInvisibleOpen(true);
      } else {
        setConfirmMakeVisibleOpen(true);
      }
    },
    [setActiveDialogProgram, setConfirmMakeInvisibleOpen, setConfirmMakeVisibleOpen]
  );

  const handleOpenProgram = useCallback(
    (v: ProgramList_Program) => {
      setOpenProgram(openProgram !== v.id ? v.id : -1);
    },
    [setOpenProgram, openProgram]
  );

  return (
    <>
      <div className="max-w-screen-xl mx-auto">
        <PageBlock>
          <div className="flex flex-row mb-12 text-white">
            <h1 className="text-4xl font-bold mt-24">{t('table.programs')}</h1>
          </div>
          <div className="flex justify-end mb-12 text-white">
            <Button onClick={insertDefaultProgram} startIcon={<MdAddCircle />} color="inherit">
              {t('table.add')}
            </Button>
          </div>
          <div className="grid grid-cols-10 text-gray-400">
            <p>{t('table.published')}</p>
            <div className="col-span-2">{t('table.title')}</div>
            <div>{t('table.short_title')}</div>
            <div>{t('table.application_start')}</div>
            <div>{t('table.application_end')}</div>
            <div>{t('table.course_start')}</div>
            <div>{t('table.course_end')}</div>
            <div>{t('table.achievement_upload_deadline')}</div>
            <div>&nbsp;</div>
          </div>
          {programs != null &&
            programs.length > 0 &&
            programs.map((v) => (
              <ProgramsRow
                key={v.id}
                program={v}
                qResult={qResult}
                openProgramId={openProgram}
                onSetPublished={handleTogglePublished}
                onSetApplicationStart={handleApplicationStart}
                onSetApplicationEnd={handleApplicationEnd}
                onSetLectureStart={handleLectureStart}
                onSetLectureEnd={handleLectureEnd}
                onSetUploadData={handleUploadDeadline}
                onOpenProgram={handleOpenProgram}
                onSetVisibilityAttendanceCertificate={handleProgramAttendanceCertificateVisible}
                onSetVisibilityAchievementCertificate={handleProgramAchievementCertVisible}
              />
            ))}
          <div className="flex justify-end mt-12 mb-12 text-white">
            <Button onClick={insertDefaultProgram} startIcon={<MdAddCircle />} color="inherit">
              {t('table.add')}
            </Button>
          </div>
        </PageBlock>
        <QuestionConfirmationDialog
          question={t('actions.publish_confirmation', {
            title: activeDialogProgram?.title,
          })}
          confirmationText={t('actions.publish')}
          onClose={() => handleMakeVisibleDialogClose(false)}
          onConfirm={() => handleMakeVisibleDialogClose(true)}
          open={confirmMakeVisibleOpen}
        />
        <QuestionConfirmationDialog
          question={t('actions.withdraw_confirmation', {
            title: activeDialogProgram?.title,
          })}
          confirmationText={t('actions.withdraw')}
          onClose={() => handleMakeInvisibleDialogClose(false)}
          onConfirm={() => handleMakeInvisibleDialogClose(true)}
          open={confirmMakeInvisibleOpen}
        />
      </div>
    </>
  );
};
