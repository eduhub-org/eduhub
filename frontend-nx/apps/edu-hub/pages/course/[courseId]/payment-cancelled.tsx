import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { Box, Typography, Button } from '@mui/material';
import { Cancel } from '@mui/icons-material';

/**
 * Payment cancelled page that allows users to retry payment.
 */
export default function PaymentCancelledPage() {
  const router = useRouter();
  const t = useTranslations('course');
  const { courseId } = router.query;

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
      <Cancel color="error" sx={{ fontSize: 64 }} />
      <Typography 
        variant="h4" 
        component="h1" 
        align="center"
        sx={{
          color: (theme) => theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary
        }}
      >
        {t('payment.cancelled_title')}
      </Typography>
      <Typography 
        variant="body1" 
        align="center" 
        sx={{ 
          maxWidth: 600,
          color: (theme) => theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary
        }}
      >
        {t('payment.cancelled_description')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => router.push(`/course/${courseId}`)}
        >
          {t('payment.try_again')}
        </Button>
        <Button
          variant="outlined"
          onClick={() => router.push('/')}
        >
          {t('payment.back_to_home')}
        </Button>
      </Box>
    </Box>
  );
}

