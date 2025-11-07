import Image from 'next/image';
import { FC, useEffect, useState, ReactNode } from 'react';
import { getTileImage } from '../../../helpers/imageHandling';

interface TileBaseProps {
  coverImage: string | null;
  title: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const TileBase: FC<TileBaseProps> = ({ coverImage: coverImageProp, title, children, onClick, className = '' }) => {
  const [coverImage, setCoverImage] = useState<string | null>(null);

  useEffect(() => {
    const loadCoverImage = async () => {
      const img = await getTileImage(coverImageProp);
      setCoverImage(img);
    };
    loadCoverImage();
  }, [coverImageProp]);

  return (
    <div 
      className={`flex flex-col rounded-2xl overflow-hidden font-medium text-edu-black ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="relative h-[230px] flex justify-start items-end">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${coverImage}")`,
          }}
        ></div>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%)',
          }}
        ></div>
        <div className="absolute inset-0 flex justify-start items-end p-3">
          <span className="text-3xl text-white">{title}</span>
        </div>
      </div>
      <div className="flex flex-col h-[201px] justify-between bg-white p-5">
        {children}
      </div>
    </div>
  );
};

