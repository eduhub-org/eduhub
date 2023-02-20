import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import { FC, ReactNode } from 'react';

import xIconBlack from '../../public/images/common/x-calibur-black.svg';
import xIconWhite from '../../public/images/common/x-calibur-white.svg';

interface IProps {
  children: ReactNode;
  closeModal: () => void;
  className?: string;
  xIconColor: 'black' | 'white';
}

export const ModalContent: FC<IProps> = ({
  children,
  className,
  closeModal,
  xIconColor = 'black',
}) => {
  const { t } = useTranslation();
  return (
    <div className={className}>
      <div className="flex">
        <div className="flex p-6 cursor-pointer" onClick={closeModal}>
          <Image
            src={xIconColor === 'black' ? xIconBlack : xIconWhite}
            width={22}
            height={21}
            alt={t('close')}
          />
        </div>
      </div>
      <div className="flex flex-col mt-4 mx-6 sm:mx-20">{children}</div>
    </div>
  );
};
