import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import { ClampedText } from './ClampedText';
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
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-label-secondary">
          {t('formbricks.questionnaire_responses')}
          {surveyName && <span className="font-normal normal-case tracking-normal">({surveyName})</span>}
        </div>
        {response.finished ? (
          <span className="text-xs text-label-secondary">
            {t('application_details.answer_count', { count: response.answers.length })}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs italic text-label-secondary">
            <span aria-hidden="true" className="not-italic text-[color:var(--eduhub-warning)]">⚠</span>
            <span>{t('formbricks.incomplete_response')}</span>
          </span>
        )}
      </div>

      <ol>
        {response.answers.map((answer) => (
          <li
            key={answer.questionId}
            className="space-y-1 border-t border-table-divider py-4"
            data-question-type={answer.questionType ?? undefined}
          >
            <div className="text-[13px] font-semibold text-label-secondary">{answer.headline}</div>
            <ClampedText text={answer.answer} className="text-[15px] leading-relaxed text-label-primary" />
          </li>
        ))}
      </ol>
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
