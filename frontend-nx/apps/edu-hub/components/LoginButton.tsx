import { signIn } from 'next-auth/react';
import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { Button } from './common/Button';

interface IProps {
  className?: string;
}

const signInHandler = () => {
  console.log('signIN!');
  return signIn('keycloak');
};

export const LoginButton: FC<IProps> = ({ className }) => {
  const { t } = useTranslation('common');
  return <Button onClick={signInHandler} className={className}>{t('loginButton')}</Button>;
};
