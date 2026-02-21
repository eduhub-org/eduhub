import { FC } from 'react';
import { CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
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
} from '../../../queries/updateProgram';
import {
  loadParticipationData,
  loadParticipationDataVariables,
} from '../../../queries/__generated__/loadParticipationData';
import InputField from '../../inputs/InputField';
import { Button } from '../../common/Button';
import FileUploadField from '../../inputs/FileUploadField';
interface ExpandableProgramRowProps {
  program: ProgramList_Program;
}

const ExpandableProgramRow: FC<ExpandableProgramRowProps> = ({ program }) => {
  const t = useTranslations('managePrograms');


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
                  {`${t('certificates.template')} ${t('certificates.proof_of_participation')}`}
                </h4>
                <FileUploadField
                  variant="material"
                  currentFileUrl={program.attendanceCertificateTemplateURL}
                  uploadMutation={SAVE_ATTENDANCE_CERTIFICATE_TEMPLATE}
                  updateMutation={UPDATE_ATTENDANCE_CERTIFICATE_TEMPLATE}
                  identifierVariables={{ programId: program.id }}
                  updateFieldName="templatePath"
                  acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
                  maxFileSize={10 * 1024 * 1024}
                  uploadText={t('certificates.upload_template')}
                  imageWidth={160}
                  imageHeight={96}
                  showFileName={true}
                  refetchQueries={['ProgramList']}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {`${t('certificates.template')} ${t('certificates.performance_certificate')}`}
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
                  uploadText={t('certificates.upload_template')}
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

