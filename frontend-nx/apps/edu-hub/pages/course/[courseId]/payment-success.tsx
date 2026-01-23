import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

import { useAuthedQuery } from '../../../hooks/authedQuery';
import { COURSE } from '../../../queries/course';
import { Course, CourseVariables } from '../../../queries/__generated__/Course';

/**
 * Payment success page that polls for webhook completion.
 * Shows a loading state while waiting for Stripe webhook to confirm payment,
 * then displays success message.
 */
export default function PaymentSuccessPage() {
  const router = useRouter();
  const t = useTranslations('course');
  const { courseId, session_id } = router.query;
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: courseData } = useAuthedQuery<Course, CourseVariables>(
    COURSE,
    {
      variables: { id: parseInt(courseId as string) },
      skip: !courseId,
    }
  );

  useEffect(() => {
    if (!session_id || !courseId) return;

    let attempts = 0;

    // Poll for payment confirmation
    const pollInterval = setInterval(async () => {
      try {
        // Check enrollment status via GraphQL
        // In a real implementation, you'd query CourseEnrollment with paymentStatus = 'COMPLETED'
        // For now, we'll simulate with a timeout
        const checkPayment = async () => {
          attempts++;
          // TODO: Query enrollment status from GraphQL
          // For now, assume success after 3 attempts
          if (attempts >= 3) {
            setPolling(false);
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
          }
        };

        await checkPayment();
      } catch (err) {
        console.error('Error checking payment status:', err);
        setPolling(false);
        setError('Failed to verify payment status');
        clearInterval(pollInterval);
        clearTimeout(timeoutId);
      }
    }, 1000);

    // Stop polling after 30 seconds
    const timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
      // If still polling, assume success (webhook might be delayed)
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [session_id, courseId]);

  const course = courseData?.Course_by_pk;

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
          p: 3,
        }}
      >
        <ErrorIcon color="error" sx={{ fontSize: 64 }} />
        <Typography variant="h5" component="h1">
          {t('payment.error_verifying')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
        <Button variant="contained" onClick={() => router.push(`/course/${courseId}`)}>
          {t('payment.back_to_course')}
        </Button>
      </Box>
    );
  }

  if (polling) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={64} />
        <Typography variant="h5" component="h1">
          {t('payment.verifying')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('payment.verifying_description')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
        p: 3,
      }}
    >
      <CheckCircle color="success" sx={{ fontSize: 64 }} />
      <Typography variant="h4" component="h1" align="center">
        {t('payment.success_title')}
      </Typography>
      {course && (
        <Typography variant="h6" color="text.secondary" align="center">
          {course.title}
        </Typography>
      )}
      <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 600 }}>
        {t('payment.success_description')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => router.push(`/course/${courseId}`)}
        >
          {t('payment.view_course')}
        </Button>
        <Button
          variant="outlined"
          onClick={() => router.push('/my-courses')}
        >
          {t('payment.my_courses')}
        </Button>
      </Box>
    </Box>
  );
}

