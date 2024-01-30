import Image from 'next/image';
import { FC } from 'react';

interface IProps {
  imageUrl: any;
}

export const Avatar: FC<IProps> = ({ imageUrl }) => {
  return (
    <div className="rounded-full border-2 border-edu-black w-10 h-10 overflow-hidden">
      {imageUrl ? <Image src={imageUrl} alt="User avatar" width={40} height={40} /> : null}
    </div>
  );
};
