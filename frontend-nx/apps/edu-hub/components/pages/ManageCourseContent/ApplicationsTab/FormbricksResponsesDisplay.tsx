import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { GET_FORMBRICKS_RESPONSES } from '../../../../queries/formbricks';
import {
  GetFormbricksResponses,
  GetFormbricksResponsesVariables,
} from '../../../../queries/__generated__/GetFormbricksResponses';

interface QuestionnaireAnswer {
  questionId: string;
  questionType?: string | null;
  headline: string;
  answer: string;
}

interface QuestionnaireResponse {
  finished: boolean;
  answers: QuestionnaireAnswer[];
}

/** Layout of CourseEnrollment.questionnaireResponse written by the Formbricks functions. */
interface StoredFormbricksResponse {
  provider: 'formbricks';
  survey?: { name?: string | null } | null;
  response?: QuestionnaireResponse | null;
}

/** The stored JSON when it holds a Formbricks response, otherwise null. */
export const parseStoredResponse = (stored: unknown): StoredFormbricksResponse | null => {
  if (!stored || typeof stored !== 'object') return null;
  const candidate = stored as StoredFormbricksResponse;
  if (candidate.provider !== 'formbricks' || !Array.isArray(candidate.response?.answers)) return null;
  return candidate;
};

interface Props {
  courseId: number;
  userId: string;
  enrollmentId?: number;
  formbricksEnrollmentSurveyUrl: string;
  /**
   * CourseEnrollment.questionnaireResponse. A finished stored response is shown without asking
   * Formbricks. An unfinished one is fetched again (the applicant may have completed it since)
   * and stays the fallback while loading or when Formbricks fails.
   */
  storedResponse?: unknown;
}

const ResponseView: FC<{ surveyName?: string | null; response: QuestionnaireResponse }> = ({
  surveyName,
  response,
}) => {
  const t = useTranslations('manageCourse');
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {t('formbricks.questionnaire_responses')}
        {surveyName && <span className="text-xs text-gray-500 font-normal">({surveyName})</span>}
      </div>

      <div className="space-y-3">
        {response.answers.map((answer) => (
          <div
            key={answer.questionId}
            className="bg-gray-50 rounded-md p-3 border border-gray-200"
            data-question-type={answer.questionType ?? undefined}
          >
            <div className="text-sm font-semibold text-gray-800 mb-2">{answer.headline}</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words bg-white rounded px-3 py-2 border border-gray-200">
              {answer.answer}
            </div>
          </div>
        ))}
      </div>

      {!response.finished && (
        <div className="text-xs text-orange-600 italic flex items-center gap-1">
          <span>⚠</span>
          <span>{t('formbricks.incomplete_response')}</span>
        </div>
      )}
    </div>
  );
};

export const FormbricksResponsesDisplay: FC<Props> = ({
  courseId,
  userId,
  enrollmentId,
  formbricksEnrollmentSurveyUrl,
  storedResponse,
}) => {
  const t = useTranslations('manageCourse');
  const stored = parseStoredResponse(storedResponse);

  // Only when nothing usable is stored yet. The function stores what it finds on the enrollment.
  const { data, loading, error } = useRoleQuery<GetFormbricksResponses, GetFormbricksResponsesVariables>(
    GET_FORMBRICKS_RESPONSES,
    {
      variables: { 
        courseId, 
        userId, 
        enrollmentId, 
        formbricksSurveyUrl: formbricksEnrollmentSurveyUrl, 
      },
      // Always fetch latest survey mapping to avoid stale question labels/order.
      fetchPolicy: 'network-only',
      skip: !!stored?.response?.finished || !formbricksEnrollmentSurveyUrl,
    }
  );

  const latestResponse = useMemo(() => {
    if (!data?.getFormbricksResponses?.responses?.length) return null;
    return data.getFormbricksResponses.responses[0];
  }, [data]);

  const storedView = stored?.response ? (
    <ResponseView surveyName={stored.survey?.name} response={stored.response} />
  ) : null;

  if (stored?.response?.finished) return storedView;

  if (loading) {
    if (storedView) return storedView;
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <CircularProgress size={16} />
        <span className="text-sm">{t('formbricks.loading_responses')}</span>
      </div>
    );
  }

  if (error || !data?.getFormbricksResponses?.success) {
    if (storedView) return storedView;
    return (
      <div className="text-sm text-red-500">
        {t('formbricks.error_loading_responses')}
      </div>
    );
  }

  if (!latestResponse) {
    if (storedView) return storedView;
    return (
      <div className="text-sm text-gray-500 italic">
        {t('formbricks.no_responses')}
      </div>
    );
  }

  return <ResponseView surveyName={data.getFormbricksResponses.survey?.name} response={latestResponse} />;
};
