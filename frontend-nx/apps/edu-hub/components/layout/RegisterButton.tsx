import { useRouter } from 'next/router';
import { FC, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '../common/Button';

export const RegisterButton: FC = () => {
  const t = useTranslations('common');
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
    <div className="light">
      <Button onClick={register} className="!border bg-fill-primary text-label-primary border-border-secondary hover:border-brand">
        {t('registerButton')}
      </Button>
    </div>
  );
};
