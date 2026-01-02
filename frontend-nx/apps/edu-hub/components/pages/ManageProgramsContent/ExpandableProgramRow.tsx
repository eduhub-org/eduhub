import { FC, useCallback, useRef } from 'react';
import { CircularProgress, IconButton } from '@mui/material';
import { MdUpload } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { useAdminQuery, useLazyRoleQuery } from '../../../hooks/authedQuery';
import { ProgramList_Program } from '../../../queries/__generated__/ProgramList';
import {
  SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE,
  SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE,
  LOAD_PARTICIPATION_DATA,
} from '../../../queries/actions';
import {
  UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE,
  UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE,
  UPDATE_START_QUESTIONAIRE,
  UPDATE_SPEAKER_QUESTIONAIRE,
  UPDATE_ClOSING_QUESTIONAIRE,
  UPDATE_DEFAULT_ENROLLMENT_SURVEY,
  UPDATE_PROGRAM_SHORT_TITLE,
  UPDATE_PROGRAM_ACHIEVEMENT_CERT_VISIBLE,
  UPDATE_PROGRAM_PARTICIPATION_CERT_VISIBLE,
} from '../../../queries/updateProgram';
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
  UpdateProgramParticipationTemplate,
  UpdateProgramParticipationTemplateVariables,
} from '../../../queries/__generated__/UpdateProgramParticipationTemplate';
import {
  loadParticipationData,
  loadParticipationDataVariables,
} from '../../../queries/__generated__/loadParticipationData';
import InputField from '../../inputs/InputField';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import { Button } from '../../common/Button';
import { parseFileUploadEvent } from '../../../helpers/filehandling';
import { PROGRAM_LIST } from '../../../queries/programList';
import {
  UpdateProgramAchievementCertVisible,
  UpdateProgramAchievementCertVisibleVariables,
} from '../../../queries/__generated__/UpdateProgramAchievementCertVisible';
import {
  UpdateProgramParticipationCertVisible,
  UpdateProgramParticipationCertVisibleVariables,
} from '../../../queries/__generated__/UpdateProgramParticipationCertVisible';

// Helper function to extract basename from a path
const getBasename = (filePath: string): string => {
  const parts = filePath.split('/');
  return parts.at(-1) || filePath;
};

interface ExpandableProgramRowProps {
  program: ProgramList_Program;
}

const ExpandableProgramRow: FC<ExpandableProgramRowProps> = ({ program }) => {
  const t = useTranslations('managePrograms');
  const qResult = useAdminQuery(PROGRAM_LIST);

  // Template upload refs
  const templateAttendanceUploadRef = useRef<HTMLInputElement>(null);
  const templateAchievementUploadRef = useRef<HTMLInputElement>(null);

  const handleUploadAttendanceTemplateClick = useCallback(() => {
    templateAttendanceUploadRef.current?.click();
  }, []);

  const handleUploadAchievementTemplateClick = useCallback(() => {
    templateAchievementUploadRef.current?.click();
  }, []);

  const [saveAttendanceCertificateTemplate] = useAdminMutation<
    SaveAttendanceCertificateTemplate,
    SaveAttendanceCertificateTemplateVariables
  >(SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE);

  const [updateParticipationTemplate] = useAdminMutation<
    UpdateProgramParticipationTemplate,
    UpdateProgramParticipationTemplateVariables
  >(UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE);

  const handleAttendanceTemplateUploadEvent = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    [saveAttendanceCertificateTemplate, qResult, updateParticipationTemplate, program.id]
  );

  const [saveAchievementCertificateTemplate] = useAdminMutation<
    SaveAchievementCertificateTemplate,
    SaveAchievementCertificateTemplateVariables
  >(SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE);

  const [updateAchievementCertificationTemplate] = useAdminMutation<
    UpdateProgramAchievementTemplate,
    UpdateProgramAchievementTemplateVariables
  >(UPDATE_ACHIEVEMENT_CERTIFICATE_TEMPLATE);

  const handleTemplateAchievementUploadEvent = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    [saveAchievementCertificateTemplate, qResult, updateAchievementCertificationTemplate, program.id]
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

  // Certificate visibility mutations (these use isVisible, not value)
  const [updateAchievementCertVisible] = useAdminMutation<
    UpdateProgramAchievementCertVisible,
    UpdateProgramAchievementCertVisibleVariables
  >(UPDATE_PROGRAM_ACHIEVEMENT_CERT_VISIBLE, {
    refetchQueries: ['ProgramList'],
  });

  const [updateParticipationCertVisible] = useAdminMutation<
    UpdateProgramParticipationCertVisible,
    UpdateProgramParticipationCertVisibleVariables
  >(UPDATE_PROGRAM_PARTICIPATION_CERT_VISIBLE, {
    refetchQueries: ['ProgramList'],
  });

  const handleAchievementCertVisibleChange = useCallback(
    async (checked: boolean) => {
      await updateAchievementCertVisible({
        variables: {
          programId: program.id,
          isVisible: checked,
        },
      });
    },
    [updateAchievementCertVisible, program.id]
  );

  const handleParticipationCertVisibleChange = useCallback(
    async (checked: boolean) => {
      await updateParticipationCertVisible({
        variables: {
          programId: program.id,
          isVisible: checked,
        },
      });
    },
    [updateParticipationCertVisible, program.id]
  );

  const achievementCertificateTemplateName = program.achievementCertificateTemplateURL
    ? getBasename(program.achievementCertificateTemplateURL)
    : t('certificates.no_template_uploaded_yet');
  const attendanceCertificateTemplateName = program.attendanceCertificateTemplateURL
    ? getBasename(program.attendanceCertificateTemplateURL)
    : t('certificates.no_template_uploaded_yet');

  return (
    <div className="w-full flex-1 min-w-0">
      <div className="bg-edu-course-list p-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Left Column */}
          <div className="space-y-4 w-full min-w-0">
            {/* 0. Short Title */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
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

            {/* 1. Questionnaires Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('start_evaluation.label')}</h4>
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

              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('speaker_evaluation.label')}</h4>
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

              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('final_evaluation.label')}</h4>
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
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {`${t('certificates.template')} ${t('certificates.proof_of_participation')}`}
              </h4>
              <div className="flex items-center space-x-2">
                <IconButton onClick={handleUploadAttendanceTemplateClick}>
                  <MdUpload size="1.5em" />
                </IconButton>
                <div className="flex-1 truncate">{attendanceCertificateTemplateName}</div>
              </div>
              <input
                ref={templateAttendanceUploadRef}
                onChange={handleAttendanceTemplateUploadEvent}
                className="hidden"
                type="file"
              />

              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {`${t('certificates.template')} ${t('certificates.performance_certificate')}`}
              </h4>
              <div className="flex items-center space-x-2">
                <IconButton onClick={handleUploadAchievementTemplateClick}>
                  <MdUpload size="1.5em" />
                </IconButton>
                <div className="flex-1 truncate">{achievementCertificateTemplateName}</div>
              </div>
              <input
                ref={templateAchievementUploadRef}
                onChange={handleTemplateAchievementUploadEvent}
                className="hidden"
                type="file"
              />
            </div>

            {/* 1. Certificate Visibility Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('certificates.show_certificates')}</h4>
              <div className="space-y-2">
                <CheckboxSelector
                  variant="material"
                  label={t('certificates.proof_of_participation')}
                  checked={program.visibilityAttendanceCertificate}
                  onValueUpdated={handleParticipationCertVisibleChange}
                />
                <CheckboxSelector
                  variant="material"
                  label={t('certificates.performance_certificate')}
                  checked={program.visibilityAchievementCertificate}
                  onValueUpdated={handleAchievementCertVisibleChange}
                />
              </div>
            </div>

            {/* 2. Participation Data Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">{t('participation_data.generate')}</h4>
              <div className="space-y-2">
                <Button as="button" onClick={handleLoadParticipationDataClick} disabled={loadParticipationDataLoading}>
                  {loadParticipationDataLoading ? <CircularProgress /> : t('participation_data.generate')}
                </Button>
                {loadParticipationDataResult && !loadParticipationDataLoading && !loadParticipationDataError && (
                  <Button
                    as="a"
                    href={loadParticipationDataResult.loadParticipationData.link}
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

