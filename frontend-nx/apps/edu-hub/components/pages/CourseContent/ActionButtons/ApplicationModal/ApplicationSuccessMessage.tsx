import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';

import { Button } from '../../../../common/Button';

interface IProps {
  closeModal: () => void;
}
export const ApplicationSuccessMessage: FC<IProps> = ({ closeModal }) => {
  const { t } = useTranslation('course-application');

  return (
    <>
      <span className="text-3xl font-semibold mb-6">{t('successTitle')}</span>
      <span className="text-base">{t('successBody')}</span>
      <div className="flex justify-center my-6">
        <Button filled onClick={closeModal}>
          {t('successCloseButtonTitle')}
        </Button>
      </div>
    </>
  );
};
