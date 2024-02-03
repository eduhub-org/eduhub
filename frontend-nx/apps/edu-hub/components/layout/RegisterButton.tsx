import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { Button } from '../common/Button';

export const RegisterButton: FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const register = useCallback(() => {
    const url = `${
      process.env.NEXT_PUBLIC_AUTH_URL
    }/realms/edu-hub/protocol/openid-connect/registrations?client_id=hasura&redirect_uri=${encodeURIComponent(
      window.location.href
    )}&response_type=code`;

    if (!url) return;
    router.push(new URL(url));
  }, [router]);

  return (
    <Button onClick={register} filled inverted>
      {t('registerButton')}
    </Button>
  );
};
