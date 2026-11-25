import { FC } from 'react';
import { useTranslations } from 'next-intl';

import Button from '../../common/Button';
import Loading from '../../common/Loading';

interface MatrixAuthStatusProps {
  /** Shown while the login is in progress. */
  message: string;
  /** Translated error; replaces the spinner when set. */
  error?: string | null;
  /** Where "try again" leads, e.g. back to /matrix/login. */
  retryHref?: string;
  /** The page the user came from (a same-site path); replaces "start page" when set. */
  backHref?: string | null;
}

/** Full-page status for the chat login redirect and callback pages. */
const MatrixAuthStatus: FC<MatrixAuthStatusProps> = ({ message, error, retryHref, backHref }) => {
  const t = useTranslations('matrixChat');

  return (
    <div className="flex flex-col justify-center items-center gap-6 min-h-[100vh] px-4 text-center">
      {error ? (
        <>
          <p className="text-lg max-w-md">{error}</p>
          <div className="flex gap-3 flex-wrap justify-center">
            {retryHref && (
              <Button as="a" href={retryHref} filled>
                {t('try_again')}
              </Button>
            )}
            {backHref && backHref !== '/' ? (
              <Button as="a" href={backHref}>
                {t('back_to_course')}
              </Button>
            ) : (
              <Button as="a" href="/">
                {t('back_home')}
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Loading />
          <p className="text-lg">{message}</p>
        </>
      )}
    </div>
  );
};

export default MatrixAuthStatus;
