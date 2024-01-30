import Image from 'next/image';
import { FC } from 'react';
import mysteryImg from './images/mystery.svg';

interface IProps {
  imageUrl: any;
}

export const Avatar: FC<IProps> = ({ imageUrl }) => {
  return (
    <div className="rounded-full border-2 border-edu-black w-10 h-10 overflow-hidden">
      {imageUrl ? (
        <Image src={imageUrl} alt="User avatar" width={40} height={40} unoptimized />
      ) : (
        // Render a default avatar or some placeholder if imageUrl is not available
        <div className="flex justify-center items-center w-full h-full">
          <Image src={mysteryImg} alt="User avatar" width={40} height={40} unoptimized />
        </div>
      )}
    </div>
  );
};
