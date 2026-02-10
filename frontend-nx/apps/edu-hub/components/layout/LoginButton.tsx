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
    <Button onClick={signInHandler} className={`bg-fill-primary text-label-primary border-fill-primary hover:border-brand-light ${className || ''}`}>
      {t('loginButton')}
    </Button>
  );
};
