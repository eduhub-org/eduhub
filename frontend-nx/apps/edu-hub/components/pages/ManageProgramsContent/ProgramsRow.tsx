/* eslint-disable @typescript-eslint/ban-ts-comment */
import { QueryResult } from '@apollo/client';
import { CircularProgress, IconButton } from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { FC, MutableRefObject, useCallback, useRef } from 'react';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { MdCheckBox, MdCheckBoxOutlineBlank, MdOutlineCheckBoxOutlineBlank, MdUpload } from 'react-icons/md';
import { Button } from '../../common/Button';
import { parseFileUploadEvent } from '../../../helpers/filehandling';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE, SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE } from '../../../queries/actions';
import { LOAD_PARTICIPATION_DATA } from '../../../queries/actions';
import {
  UPDATE_PROGRAM_SHORT_TITLE,
  UPDATE_PROGRAM_TITLE,
  UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE,
  UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE,
  UPDATE_START_QUESTIONAIRE,
  UPDATE_SPEAKER_QUESTIONAIRE,
  UPDATE_ClOSING_QUESTIONAIRE,
} from '../../../queries/updateProgram';
import { ProgramList_Program } from '../../../queries/__generated__/ProgramList';
import {
  SaveAchievementCertificateTemplate,
  SaveAchievementCertificateTemplateVariables,
} from '../../../queries/__generated__/SaveAchievementCertificateTemplate';
import {
  SaveAttendanceCertificateTemplate,
  SaveAttendanceCertificateTemplateVariables,
} from '../../../queries/__generated__/SaveAttendanceCertificateTemplate';

import {
  UpdateProgramAchievementTemplate,
  UpdateProgramAchievementTemplateVariables,
} from '../../../queries/__generated__/UpdateProgramAchievementTemplate';
import {
  loadParticipationData,
  loadParticipationDataVariables,
} from '../../../queries/__generated__/loadParticipationData';
import {
  UpdateProgramParticipationTemplate,
  UpdateProgramParticipationTemplateVariables,
} from '../../../queries/__generated__/UpdateProgramParticipationTemplate';
import path from 'path';
import InputField from '../../inputs/InputField';
import TableGridDeleteButton from '../../common/TableGrid/components/TableGridDeleteButton';
import { DELETE_PROGRAM } from '../../../queries/updateProgram';

interface ProgramsRowProps {
  program: ProgramList_Program;
  openProgramId: number;
  qResult: QueryResult<any>;
  onSetPublished: (p: ProgramList_Program, isPublished: boolean) => any;
  onSetApplicationStart: (p: ProgramList_Program, start: Date | null) => any;
  onSetApplicationEnd: (p: ProgramList_Program, end: Date | null) => any;
  onSetLectureStart: (p: ProgramList_Program, start: Date | null) => any;
  onSetLectureEnd: (p: ProgramList_Program, end: Date | null) => any;
  onSetUploadData: (p: ProgramList_Program, d: Date | null) => any;
  onSetVisibilityAttendanceCertificate: (p: ProgramList_Program, isVisible: boolean) => any;
  onSetVisibilityAchievementCertificate: (p: ProgramList_Program, isVisible: boolean) => any;
  onOpenProgram: (p: ProgramList_Program) => any;
}

export const ProgramsRow: FC<ProgramsRowProps> = ({
  program,
  openProgramId,
  qResult,
  onSetApplicationEnd,
  onOpenProgram,
  onSetApplicationStart,
  onSetLectureEnd,
  onSetLectureStart,
  onSetUploadData,
  onSetPublished,
  onSetVisibilityAttendanceCertificate,
  onSetVisibilityAchievementCertificate,
}) => {
  const handleToggleVisibilityAttendanceCertificate = useCallback(() => {
    onSetVisibilityAttendanceCertificate(program, !program.visibilityAttendanceCertificate);
  }, [program, onSetVisibilityAttendanceCertificate]);

  const handleToggleVisibilityAchievementCertificate = useCallback(() => {
    onSetVisibilityAchievementCertificate(program, !program.visibilityAchievementCertificate);
  }, [program, onSetVisibilityAchievementCertificate]);

  const handleTogglePublished = useCallback(() => {
    onSetPublished(program, !program.published);
  }, [program, onSetPublished]);

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

  const templateAttendanceUploadRef: MutableRefObject<any> = useRef(null);
  const handleUploadAttendanceTemplateClick = useCallback(() => {
    templateAttendanceUploadRef.current?.click();
  }, [templateAttendanceUploadRef]);

  const [saveAttendanceCertificateTemplate] = useAdminMutation<
    SaveAttendanceCertificateTemplate,
    SaveAttendanceCertificateTemplateVariables
  >(SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE);

  const [updateParticipationTemplate] = useAdminMutation<
    UpdateProgramParticipationTemplate,
    UpdateProgramParticipationTemplateVariables
  >(UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE);

  const handleAttendanceTemplateUploadEvent = useCallback(
    async (event: any) => {
      const uploadFile = await parseFileUploadEvent(event);

      if (uploadFile != null) {
        const res = await saveAttendanceCertificateTemplate({
          variables: {
            base64File: uploadFile.data,
            fileName: uploadFile.name,
            programId: program.id,
          },
        });

        if (res.data?.saveAttendanceCertificateTemplate?.success) {
          await updateParticipationTemplate({
            variables: {
              programId: program.id,
              templatePath: res.data.saveAttendanceCertificateTemplate.filePath,
            },
          });

          qResult.refetch();
        }
      }
    },
    [saveAttendanceCertificateTemplate, qResult, updateParticipationTemplate, program]
  );

  const templateAchievementUploadRef: MutableRefObject<any> = useRef(null);
  const handleUploadAchievementTemplateClick = useCallback(() => {
    templateAchievementUploadRef.current?.click();
  }, [templateAchievementUploadRef]);

  const [saveAchievementCertificateTemplate] = useAdminMutation<
    SaveAchievementCertificateTemplate,
    SaveAchievementCertificateTemplateVariables
  >(SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE);

  const [updateAchievementCertificationTemplate] = useAdminMutation<
    UpdateProgramAchievementTemplate,
    UpdateProgramAchievementTemplateVariables
  >(UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE);

  const [
    loadParticipationData,
    { data: loadParticipationDataResult, loading: loadParticipationDataLoading, error: loadParticipationDataError },
  ] = useLazyRoleQuery<loadParticipationData, loadParticipationDataVariables>(LOAD_PARTICIPATION_DATA, {
    variables: { programId: program.id },
  });

  const handleLoadParticipationDataClick = () => {
    try {
      loadParticipationData();
    } catch (error) {
      console.log('loadParticipationDataError', error);
    }
  };

  const handleTemplateAchievementUploadEvent = useCallback(
    async (event: any) => {
      const uFile = await parseFileUploadEvent(event);
      if (uFile != null) {
        try {
          const response = await saveAchievementCertificateTemplate({
            variables: {
              base64File: uFile.data,
              fileName: uFile.name,
              programId: program.id,
            },
          });

          if (response.data?.saveAchievementCertificateTemplate?.success) {
            await updateAchievementCertificationTemplate({
              variables: {
                programId: program.id,
                templatePath: response.data.saveAchievementCertificateTemplate.filePath,
              },
            });

            qResult.refetch();
          }
        } catch (error) {
          console.error('Error saving achievement certificate template:', error);
        }
      }
    },
    [saveAchievementCertificateTemplate, qResult, updateAchievementCertificationTemplate, program]
  );

  const t = useTranslations('managePrograms');
  const locale = useLocale();

  const achievementCertificateTemplateName = program.achievementCertificateTemplateURL
    ? path.basename(program.achievementCertificateTemplateURL)
    : t('course-page:no-template-uploaded-yet');
  const attendanceCertificateTemplateName = program.attendanceCertificateTemplateURL
    ? path.basename(program.attendanceCertificateTemplateURL)
    : t('course-page:no-template-uploaded-yet');

  return (
    <div>
      <div className="grid grid-cols-10 mb-1 bg-gray-100">
        <div className="flex justify-center cursor-pointer" onClick={handleTogglePublished}>
          {!program.published && <MdCheckBoxOutlineBlank size="1.5em" />}
          {program.published && <MdCheckBox size="1.5em" />}
        </div>

        <div className="col-span-2">
          <InputField
            variant="material"
            type="input"
            placeholder={t('title.placeholder')}
            itemId={program.id}
            value={program.title}
            updateValueMutation={UPDATE_PROGRAM_TITLE}
          />
        </div>

        <div>
          <InputField
            variant="material"
            type="input"
            placeholder={t('short_title.placeholder')}
            itemId={program.id}
            value={program.shortTitle ?? ''}
            updateValueMutation={UPDATE_PROGRAM_SHORT_TITLE}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            className="w-full bg-gray-100"
            dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
            selected={program.applicationStart || new Date()}
            onChange={handleSetApplicationStart}
            locale={locale}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
            className="w-full bg-gray-100"
            selected={program.defaultApplicationEnd || new Date()}
            onChange={handleSetApplicationEnd}
            locale={locale}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
            className="w-full bg-gray-100"
            selected={program.lectureStart || new Date()}
            onChange={handleSetLectureStart}
            locale={locale}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
            className="w-full bg-gray-100"
            selected={program.lectureEnd || new Date()}
            onChange={handleSetLectureEnd}
            locale={locale}
          />
        </div>

        <div>
          {/* @ts-ignore: https://github.com/Hacker0x01/react-datepicker/issues/3784 */}
          <DatePicker
            dateFormat={locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
            className="w-full bg-gray-100"
            selected={program.achievementRecordUploadDeadline || new Date()}
            onChange={handleSetUploadData}
            locale={locale}
          />
        </div>

        <div className="grid grid-cols-2">
          <div>
            <IconButton onClick={handleOpenProgram}>
              {openProgramId !== program.id ? <IoIosArrowDown size="0.75em" /> : <IoIosArrowUp size="0.75em" />}
            </IconButton>
          </div>

          <div>
            <TableGridDeleteButton
              deleteMutation={DELETE_PROGRAM}
              id={program.id}
              refetchQueries={['ProgramList']}
              idType="number"
              deletionConfirmationQuestion={t('managePrograms:delete_button.delete_program_confirmation', {
                title: program.title || t('managePrograms:delete_button.untitled_program'),
              })}
            />
          </div>
        </div>
      </div>

      {program.id === openProgramId && (
        <div className="mb-1">
          <div className="grid grid-cols-3 bg-gray-100 p-10">
            <div className="p-3">
              <span>{t('start_evaluation.label')}</span>
              <br />
              <InputField
                variant="material"
                type="link"
                placeholder={t('start_evaluation.placeholder')}
                itemId={program.id}
                value={program.startQuestionnaire || ''}
                updateValueMutation={UPDATE_START_QUESTIONAIRE}
              />
            </div>
            <div className="p-3">
              <span>{t('speaker_evaluation.label')}</span>
              <br />
              <InputField
                variant="material"
                type="link"
                placeholder={t('speaker_evaluation.placeholder')}
                itemId={program.id}
                value={program.speakerQuestionnaire || ''}
                updateValueMutation={UPDATE_SPEAKER_QUESTIONAIRE}
              />
            </div>
            <div className="p-3">
              <span>{t('final_evaluation.label')}</span>
              <br />
              <InputField
                variant="material"
                type="link"
                placeholder={t('final_evaluation.placeholder')}
                itemId={program.id}
                value={program.closingQuestionnaire || ''}
                updateValueMutation={UPDATE_ClOSING_QUESTIONAIRE}
              />
            </div>

            <div className="p-3">
              {`${t('course-page:template')} ${t('course-page:proof-of-participation')}`}

              <IconButton onClick={handleUploadAttendanceTemplateClick}>
                <MdUpload size="0.75em" />
              </IconButton>
              <br />
              <div className="w-80 truncate">{attendanceCertificateTemplateName}</div>
              <input
                ref={templateAttendanceUploadRef}
                onChange={handleAttendanceTemplateUploadEvent}
                className="hidden"
                type="file"
              />
            </div>
            <div className="p-3">
              {`${t('course-page:template')} ${t('course-page:performance-certificate')}`}
              <IconButton onClick={handleUploadAchievementTemplateClick}>
                <MdUpload size="0.75em" />
              </IconButton>
              <br />
              <div className="w-80 truncate">{achievementCertificateTemplateName}</div>
              <input
                ref={templateAchievementUploadRef}
                onChange={handleTemplateAchievementUploadEvent}
                className="hidden"
                type="file"
              />
            </div>
            <div className="p-3">
              {`${t('course-page:show-certificates')}:`}
              <div className="grid grid-cols-10">
                <div className="cursor-pointer" onClick={handleToggleVisibilityAttendanceCertificate}>
                  {program.visibilityAttendanceCertificate && <MdCheckBox size="1.5em" />}
                  {!program.visibilityAttendanceCertificate && <MdOutlineCheckBoxOutlineBlank size="1.5em" />}
                </div>
                <div className="col-span-9">{t('course-page:proof-of-participation')}</div>
              </div>
              <div className="grid grid-cols-10">
                <div className="cursor-pointer" onClick={handleToggleVisibilityAchievementCertificate}>
                  {program.visibilityAchievementCertificate && <MdCheckBox size="1.5em" />}
                  {!program.visibilityAchievementCertificate && <MdOutlineCheckBoxOutlineBlank size="1.5em" />}
                </div>
                <div className="col-span-9">{t('course-page:performance-certificate')}</div>
              </div>
            </div>
            <div className="p-3">
              <Button as="button" onClick={handleLoadParticipationDataClick} disabled={loadParticipationDataLoading}>
                {loadParticipationDataLoading ? <CircularProgress /> : t('course-page:participationDataGenerate')}
              </Button>
            </div>
            <div className="p-3">
              {loadParticipationDataResult && !loadParticipationDataLoading && !loadParticipationDataError && (
                <Button
                  as="a"
                  href={loadParticipationDataResult.loadParticipationData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {t('course-page:participationDataDownload')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
