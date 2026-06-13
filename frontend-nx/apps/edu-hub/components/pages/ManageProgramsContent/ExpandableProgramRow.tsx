import { FC, useCallback, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useLazyRoleQuery, useRoleQuery } from '../../../hooks/authedQuery';
import { useManageMutation } from '../../../hooks/authedMutation';
import { ProgramList_Program } from '../../../queries/__generated__/ProgramList';
import { ProjectTypes } from '../../../queries/__generated__/ProjectTypes';
import {
  SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE,
  SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE,
  LOAD_PARTICIPATION_DATA,
} from '../../../queries/actions';
import {
  UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE,
  UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE,
  UPDATE_PROGRAM_ATTENDANCE_CERTIFICATE_TEMPLATE_ID,
  UPDATE_START_QUESTIONAIRE,
  UPDATE_SPEAKER_QUESTIONAIRE,
  UPDATE_ClOSING_QUESTIONAIRE,
  UPDATE_DEFAULT_ENROLLMENT_SURVEY,
  UPDATE_PROGRAM_SHORT_TITLE,
  UPDATE_PROGRAM_MATRIX_INSTRUCTOR_ROOM,
  UPDATE_PROGRAM_SHOW_EXTENDED_APPLICATION_PERIOD_BANNER,
  UPDATE_PROGRAM_DEFAULT_PROJECT_SUBMISSION_DEADLINE,
  UPDATE_PROGRAM_DEFAULT_PROJECT_TYPE,
  UPDATE_PROGRAM_PROJECT_PROPOSALS_ENABLED_BY_DEFAULT,
} from '../../../queries/updateProgram';
import { CERTIFICATE_TEMPLATES } from '../../../queries/certificateTemplates';
import { CertificateTemplates } from '../../../queries/__generated__/CertificateTemplates';
import { PROGRAM_TYPE_DEFAULTS } from '../../../queries/programTypeDefaults';
import { ProgramTypeDefaults } from '../../../queries/__generated__/ProgramTypeDefaults';
import {
  UpdateProgramAttendanceCertificateTemplateId,
  UpdateProgramAttendanceCertificateTemplateIdVariables,
} from '../../../queries/__generated__/UpdateProgramAttendanceCertificateTemplateId';
import { PROJECT_TYPES } from '../../../queries/project';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import DropDownSelector from '../../inputs/DropDownSelector';
import DatePicker from '../../inputs/DatePicker';
import { SYNC_PROGRAM_INSTRUCTOR_MATRIX_ROOM } from '../../../queries/syncProgramInstructorMatrixRoom';
import {
  SyncProgramInstructorMatrixRoom,
  SyncProgramInstructorMatrixRoomVariables,
} from '../../../queries/__generated__/SyncProgramInstructorMatrixRoom';
import { normalizeMatrixRoomId, isValidMatrixRoomId } from '../../../utils/matrixRoom';
import {
  loadParticipationData,
  loadParticipationDataVariables,
} from '../../../queries/__generated__/loadParticipationData';
import InputField from '../../inputs/InputField';
import { Button } from '../../common/Button';
import FileUploadField from '../../inputs/FileUploadField';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { submissionDeadlineToCalendarDate } from '../CourseContent/Projects/projectEffectiveSubmissionDeadline';
interface ExpandableProgramRowProps {
  program: ProgramList_Program;
}

const ExpandableProgramRow: FC<ExpandableProgramRowProps> = ({ program }) => {
  const t = useTranslations('managePrograms');
  const [syncNotice, setSyncNotice] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const { data: projectTypesData } = useRoleQuery<ProjectTypes>(PROJECT_TYPES);
  const { data: certificateTemplatesData, loading: certificateTemplatesLoading } =
    useRoleQuery<CertificateTemplates>(CERTIFICATE_TEMPLATES);
  const { data: programTypeDefaultsData, loading: programTypeDefaultsLoading } =
    useRoleQuery<ProgramTypeDefaults>(PROGRAM_TYPE_DEFAULTS);
  const defaultAttendanceCertificateTemplateId =
    programTypeDefaultsData?.ProgramType.find((pt) => pt.value === program.type)
      ?.defaultAttendanceCertificateTemplateId ?? null;
  const canApplyAttendanceTemplateDefault =
    !programTypeDefaultsLoading &&
    Boolean(programTypeDefaultsData) &&
    defaultAttendanceCertificateTemplateId != null;
  const [updateAttendanceCertificateTemplateId] = useManageMutation<
    UpdateProgramAttendanceCertificateTemplateId,
    UpdateProgramAttendanceCertificateTemplateIdVariables
  >(UPDATE_PROGRAM_ATTENDANCE_CERTIFICATE_TEMPLATE_ID, { refetchQueries: ['ProgramList'] });
  const attendanceCertificateTemplateOptions = useMemo(
    () =>
      (certificateTemplatesData?.CertificateTemplate ?? []).map((tpl) => ({
        value: String(tpl.id),
        label: tpl.name,
      })),
    [certificateTemplatesData?.CertificateTemplate]
  );
  const handleAttendanceCertificateTemplateChange = useCallback(
    (newValue: string) => {
      if (newValue === '' && !canApplyAttendanceTemplateDefault) {
        return newValue;
      }
      const templateId =
        newValue === '' ? defaultAttendanceCertificateTemplateId : parseInt(newValue, 10);
      void updateAttendanceCertificateTemplateId({
        variables: {
          programId: program.id,
          value: templateId,
        },
      });
      return newValue;
    },
    [
      canApplyAttendanceTemplateDefault,
      defaultAttendanceCertificateTemplateId,
      program.id,
      updateAttendanceCertificateTemplateId,
    ]
  );
  const projectTypeOptions = useMemo(
    () =>
      (projectTypesData?.ProjectType ?? []).map((pt) => ({
        value: pt.value,
        label: t(`project_defaults.type_options.${pt.value}`),
      })),
    [projectTypesData?.ProjectType, t]
  );

  const defaultProjectSubmissionDeadline = useMemo(
    () => submissionDeadlineToCalendarDate(program.defaultProjectSubmissionDeadline),
    [program.defaultProjectSubmissionDeadline]
  );

  const [syncProgramInstructorRoom, { loading: syncLoading }] = useManageMutation<
    SyncProgramInstructorMatrixRoom,
    SyncProgramInstructorMatrixRoomVariables
  >(SYNC_PROGRAM_INSTRUCTOR_MATRIX_ROOM);

  const transformMatrixInstructorRoomInput = useCallback((raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const normalized = normalizeMatrixRoomId(trimmed);
    if (!normalized || !isValidMatrixRoomId(normalized)) return null;
    return normalized;
  }, []);

  const handleMatrixInstructorRoomSaved = useCallback(
    async (data: { update_Program_by_pk?: { matrixInstructorRoomId?: string | null } | null }) => {
      const roomId = data?.update_Program_by_pk?.matrixInstructorRoomId?.trim() ?? '';
      if (!roomId) {
        return;
      }
      if (!isValidMatrixRoomId(roomId)) {
        setSyncNotice({
          open: true,
          message: t('instructor_element_room.invalid_room_id'),
        });
        return;
      }
      try {
        const res = await syncProgramInstructorRoom({ variables: { programId: program.id } });
        const payload = res.data?.syncProgramInstructorMatrixRoom;
        if (payload?.success) {
          setSyncNotice({
            open: true,
            message: t('instructor_element_room.sync_success', {
              invited: payload.invitedCount ?? 0,
              skipped: payload.skippedCount ?? 0,
            }),
          });
        } else {
          setSyncNotice({
            open: true,
            message: payload?.error || t('instructor_element_room.sync_error'),
          });
        }
      } catch (e) {
        setSyncNotice({
          open: true,
          message: e instanceof Error ? e.message : t('instructor_element_room.sync_error'),
        });
      }
    },
    [program.id, syncProgramInstructorRoom, t]
  );

  const [
    loadParticipationData,
    { data: loadParticipationDataResult, loading: loadParticipationDataLoading, error: loadParticipationDataError },
  ] = useLazyRoleQuery<loadParticipationData, loadParticipationDataVariables>(LOAD_PARTICIPATION_DATA, {
    variables: { programId: program.id },
  });

  const handleLoadParticipationDataClick = async () => {
    try {
      await loadParticipationData();
    } catch (error) {
      console.log('loadParticipationDataError', error);
    }
  };

  return (
    <div className="w-full flex-1 min-w-0">
      <NotificationSnackbar
        open={syncNotice.open}
        message={syncNotice.message}
        duration={6000}
        onClose={() => setSyncNotice((s) => ({ ...s, open: false }))}
      />
      <div className="bg-fill-primary text-label-primary p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* 0. Short Title */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
              <InputField
                variant="material"
                type="input"
                label={t('short_title.label')}
                placeholder={t('short_title.placeholder')}
                helpText={t('short_title.help_text')}
                itemId={program.id}
                value={program.shortTitle ?? ''}
                updateValueMutation={UPDATE_PROGRAM_SHORT_TITLE}
                refetchQueries={['ProgramList']}
              />
            </div>

            {/* Instructor Element room (program-wide) */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
              <InputField
                variant="material"
                type="input"
                maxLength={500}
                label={t('instructor_element_room.label')}
                placeholder={t('instructor_element_room.placeholder')}
                helpText={t('instructor_element_room.help_text')}
                itemId={program.id}
                value={program.matrixInstructorRoomId ?? ''}
                updateValueMutation={UPDATE_PROGRAM_MATRIX_INSTRUCTOR_ROOM}
                transformMutationText={transformMatrixInstructorRoomInput}
                transformRejectedMessage={t('instructor_element_room.invalid_room_id')}
                onValueUpdated={handleMatrixInstructorRoomSaved}
                refetchQueries={['ProgramList']}
              />
              {syncLoading ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-label-secondary">
                  <CircularProgress size={18} />
                  {t('instructor_element_room.sync_in_progress')}
                </div>
              ) : null}
            </div>

            {/* Extended application period banner */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
              <CheckboxSelector
                variant="material"
                label={t('extended_application_banner.label')}
                helpText={t('extended_application_banner.help_text')}
                checked={Boolean(program.showExtendedApplicationPeriodBanner)}
                updateValueMutation={UPDATE_PROGRAM_SHOW_EXTENDED_APPLICATION_PERIOD_BANNER}
                identifierVariables={{ programId: program.id }}
                refetchQueries={['ProgramList']}
              />
            </div>

            {/* Project defaults */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-label-primary mb-1">
                {t('project_defaults.section_title')}
              </h4>
              <CheckboxSelector
                variant="material"
                label={t('project_defaults.proposals_enabled_by_default.label')}
                helpText={t('project_defaults.proposals_enabled_by_default.help_text')}
                checked={Boolean(program.projectProposalsEnabledByDefault)}
                updateValueMutation={UPDATE_PROGRAM_PROJECT_PROPOSALS_ENABLED_BY_DEFAULT}
                identifierVariables={{ programId: program.id }}
                refetchQueries={['ProgramList']}
              />
              <DropDownSelector
                variant="material"
                label={t('project_defaults.default_project_type.label')}
                helpText={t('project_defaults.default_project_type.help_text')}
                value={program.defaultProjectType ?? ''}
                options={projectTypeOptions}
                updateValueMutation={UPDATE_PROGRAM_DEFAULT_PROJECT_TYPE}
                identifierVariables={{ itemId: program.id }}
                refetchQueries={['ProgramList']}
              />
              <DatePicker
                variant="material"
                label={t('project_defaults.default_submission_deadline.label')}
                helpText={t('project_defaults.default_submission_deadline.help_text')}
                itemId={program.id}
                value={defaultProjectSubmissionDeadline}
                updateValueMutation={UPDATE_PROGRAM_DEFAULT_PROJECT_SUBMISSION_DEADLINE}
                identifierVariables={{ itemId: program.id }}
                dateFieldName="value"
                refetchQueries={['ProgramList']}
              />
            </div>

            {/* 1. Questionnaires Card */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-label-primary mb-3">{t('start_evaluation.label')}</h4>
              <InputField
                variant="material"
                type="link"
                placeholder={t('start_evaluation.placeholder')}
                itemId={program.id}
                value={program.startQuestionnaire || ''}
                updateValueMutation={UPDATE_START_QUESTIONAIRE}
                refetchQueries={['ProgramList']}
                helpText={t('start_evaluation.help_text')}
              />

              <h4 className="text-sm font-medium text-label-primary mb-3">{t('speaker_evaluation.label')}</h4>
              <InputField
                variant="material"
                type="link"
                placeholder={t('speaker_evaluation.placeholder')}
                itemId={program.id}
                value={program.speakerQuestionnaire || ''}
                updateValueMutation={UPDATE_SPEAKER_QUESTIONAIRE}
                refetchQueries={['ProgramList']}
                helpText={t('speaker_evaluation.help_text')}
              />

              <h4 className="text-sm font-medium text-label-primary mb-3">{t('final_evaluation.label')}</h4>
              <InputField
                variant="material"
                type="link"
                placeholder={t('final_evaluation.placeholder')}
                itemId={program.id}
                value={program.closingQuestionnaire || ''}
                updateValueMutation={UPDATE_ClOSING_QUESTIONAIRE}
                refetchQueries={['ProgramList']}
                helpText={t('final_evaluation.help_text')}
              />

              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('default_enrollment_survey.label')}</h4>
              <InputField
                variant="material"
                type="link"
                placeholder={t('default_enrollment_survey.placeholder')}
                itemId={program.id}
                value={program.defaultFormbricksEnrollmentSurveyUrl || ''}
                updateValueMutation={UPDATE_DEFAULT_ENROLLMENT_SURVEY}
                refetchQueries={['ProgramList']}
                helpText={t('default_enrollment_survey.help_text')}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* 0. Certificate Templates Card */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-label-primary mb-3">
                  {`${t('Certificates.template')} ${t('Certificates.proof_of_participation')}`}
                </h4>
                <div className="mb-3 [&_.MuiInputBase-root]:min-h-[44px]">
                  <DropDownSelector
                    variant="material"
                    label={t('Certificates.html_template_label')}
                    value={
                      program.attendanceCertificateTemplateId != null
                        ? String(program.attendanceCertificateTemplateId)
                        : ''
                    }
                    options={attendanceCertificateTemplateOptions}
                    nullable={canApplyAttendanceTemplateDefault}
                    nullableLabel={t('Certificates.html_template_apply_default')}
                    disabled={
                      certificateTemplatesLoading ||
                      programTypeDefaultsLoading ||
                      attendanceCertificateTemplateOptions.length === 0
                    }
                    onValueUpdated={handleAttendanceCertificateTemplateChange}
                  />
                </div>
                {!canApplyAttendanceTemplateDefault && !programTypeDefaultsLoading && (
                  <p className="text-xs text-label-secondary mb-3">
                    {t('Certificates.apply_default_unavailable')}
                  </p>
                )}
                <FileUploadField
                  variant="material"
                  currentFileUrl={program.attendanceCertificateTemplateURL}
                  uploadMutation={SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE}
                  updateMutation={UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE}
                  identifierVariables={{ programId: program.id }}
                  updateFieldName="templatePath"
                  acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
                  maxFileSize={10 * 1024 * 1024}
                  uploadText={t('Certificates.upload_template')}
                  imageWidth={160}
                  imageHeight={96}
                  showFileName={true}
                  refetchQueries={['ProgramList']}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {`${t('Certificates.template')} ${t('Certificates.performance_certificate')}`}
                </h4>
                <FileUploadField
                  variant="material"
                  currentFileUrl={program.achievementCertificateTemplateURL}
                  uploadMutation={SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE}
                  updateMutation={UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE}
                  identifierVariables={{ programId: program.id }}
                  updateFieldName="templatePath"
                  acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
                  maxFileSize={10 * 1024 * 1024}
                  uploadText={t('Certificates.upload_template')}
                  imageWidth={160}
                  imageHeight={96}
                  showFileName={true}
                  refetchQueries={['ProgramList']}
                />
              </div>
            </div>

            {/* 1. Participation Data Card */}
            <div className="bg-fill-primary border border-border-primary rounded-lg p-4">
              <h4 className="text-sm font-medium text-label-primary mb-3">{t('participation_data.generate')}</h4>
              <div className="space-y-2">
                <Button as="button" onClick={handleLoadParticipationDataClick} disabled={loadParticipationDataLoading}>
                  {loadParticipationDataLoading ? <CircularProgress /> : t('participation_data.generate')}
                </Button>
                {loadParticipationDataResult && !loadParticipationDataLoading && !loadParticipationDataError && (
                  <Button
                    as="a"
                    href={loadParticipationDataResult.loadParticipationData.link ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {t('participation_data.download')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableProgramRow;

