import { FC, useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  surveyUrl: string;
  userId: string;
  courseId: number;
  enrollmentId?: number;
  onComplete: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Embeds a Formbricks survey via iframe with hidden field passthrough.
 * Listens for the formbricksSurveyCompleted event.
 */
export const FormbricksSurveyEmbed: FC<Props> = ({
  surveyUrl,
  userId,
  courseId,
  enrollmentId,
  onComplete,
  onError,
  className = '',
}) => {
  const t = useTranslations('course');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Build the survey URL with hidden fields
  const buildSurveyUrl = useCallback(() => {
    try {
      const url = new URL(surveyUrl);
      url.searchParams.set('embed', 'true');
      // Use eduhub* prefix to avoid conflicts with Formbricks internal variables
      url.searchParams.set('eduhubUserId', userId);
      url.searchParams.set('eduhubCourseId', String(courseId));
      if (enrollmentId) {
        // enrollmentId is optional because enrollment is created AFTER survey completion during registration
        url.searchParams.set('eduhubEnrollmentId', String(enrollmentId));
      }
      return url.toString();
    } catch {
      return surveyUrl;
    }
  }, [surveyUrl, userId, courseId, enrollmentId]);

  // Listen for survey completion event
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message origin matches Formbricks
      try {
        const surveyOrigin = new URL(surveyUrl).origin;
        if (event.origin !== surveyOrigin) return;
      } catch {
        // Security: Block messages when URL parsing fails to prevent accepting
        // messages from unknown origins. Fail-secure: if we can't verify origin,
        // we shouldn't trust the message.
        return;
      }

      if (event.data === 'formbricksSurveyCompleted') {
        onComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [surveyUrl, onComplete]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.(t('formbricks.embed_error'));
  }, [onError, t]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-md">
        <p className="text-red-600">{t('formbricks.embed_error')}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height: '100%', minHeight: '700px' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      <iframe
        src={buildSurveyUrl()}
        className="w-full h-full border-0 rounded-md"
        style={{ minHeight: '700px', height: '100%' }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={t('formbricks.survey_title')}
        allow="camera; microphone"
      />
    </div>
  );
};

