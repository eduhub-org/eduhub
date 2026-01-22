import { signIn } from 'next-auth/react';
import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../common/Button';

interface IProps {
  className?: string;
}

const signInHandler = () => {
  console.log('signIN!');
  return signIn('keycloak');
};

export const LoginButton: FC<IProps> = ({ className }) => {
  const t = useTranslations('common');
  return (
    <Button onClick={signInHandler} className={className} filled>
      {t('loginButton')}
    </Button>
  );
};
