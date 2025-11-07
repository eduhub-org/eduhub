import Image from 'next/image';
import { FC, useEffect, useState, ReactNode, memo } from 'react';
import { getTileImage } from '../../../helpers/imageHandling';

interface TileBaseProps {
  coverImage: string | null;
  title: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

const TileBaseComponent: FC<TileBaseProps> = ({ coverImage: coverImageProp, title, children, onClick, className = '' }) => {
  // Initialize with placeholder immediately to prevent layout shifts
  const [coverImage, setCoverImage] = useState<string>('https://picsum.photos/240/144');

  useEffect(() => {
    let isMounted = true;
    
    const loadCoverImage = async () => {
      if (coverImageProp) {
        try {
          const img = await getTileImage(coverImageProp);
          if (isMounted) {
            setCoverImage(img);
          }
        } catch (error) {
          // Keep placeholder on error
          console.warn('Failed to load tile image:', error);
        }
      }
    };
    
    loadCoverImage();
    
    return () => {
      isMounted = false;
    };
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

// Memoize to prevent unnecessary re-renders that could interfere with Swiper
export const TileBase = memo(TileBaseComponent);

