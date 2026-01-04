import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { GET_FORMBRICKS_RESPONSES } from '../../../../queries/formbricks';
import {
  GetFormbricksResponses,
  GetFormbricksResponsesVariables,
} from '../../../../queries/__generated__/GetFormbricksResponses';
interface Props {
  courseId: number;
  userId: string;
  enrollmentId?: number;
  formbricksEnrollmentSurveyUrl: string;
}

export const FormbricksResponsesDisplay: FC<Props> = ({
  courseId,
  userId,
  enrollmentId,
  formbricksEnrollmentSurveyUrl,
}) => {
  const t = useTranslations('manageCourse');
  
  const { data, loading, error } = useRoleQuery<GetFormbricksResponses, GetFormbricksResponsesVariables>(
    GET_FORMBRICKS_RESPONSES,
    {
      variables: { 
        courseId, 
        userId, 
        enrollmentId, 
        formbricksSurveyUrl: formbricksEnrollmentSurveyUrl, 
      },
      fetchPolicy: 'cache-first',
      skip: !formbricksEnrollmentSurveyUrl,
    }
  );

  const latestResponse = useMemo(() => {
    if (!data?.getFormbricksResponses?.responses?.length) return null;
    return data.getFormbricksResponses.responses[0];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <CircularProgress size={16} />
        <span className="text-sm">{t('formbricks.loading_responses')}</span>
      </div>
    );
  }

  if (error || !data?.getFormbricksResponses?.success) {
    return (
      <div className="text-sm text-red-500">
        {t('formbricks.error_loading_responses')}
      </div>
    );
  }

  if (!latestResponse) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('formbricks.no_responses')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {t('formbricks.questionnaire_responses')}
        {data.getFormbricksResponses.survey?.name && (
          <span className="text-xs text-gray-500 font-normal">
            ({data.getFormbricksResponses.survey.name})
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {latestResponse.answers.map((answer) => (
          <div key={answer.questionId} className="bg-gray-50 rounded-md p-3 border border-gray-200">
            <div className="text-sm font-semibold text-gray-800 mb-2">
              {answer.headline}
            </div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap bg-white rounded px-3 py-2 border border-gray-200">
              {answer.answer}
            </div>
          </div>
        ))}
      </div>
      
      {!latestResponse.finished && (
        <div className="text-xs text-orange-600 italic flex items-center gap-1">
          <span>⚠</span>
          <span>{t('formbricks.incomplete_response')}</span>
        </div>
      )}
    </div>
  );
};

