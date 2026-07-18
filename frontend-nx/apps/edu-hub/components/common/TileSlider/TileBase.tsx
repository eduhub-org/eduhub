import { FC, useEffect, useState, ReactNode, memo } from 'react';
import { getTileImage } from '../../../helpers/imageHandling';
import { useFittingTileTitleFontSize } from './useFittingTileTitleFontSize';

interface TileBaseProps {
  coverImage: string | null;
  title: string;
  children: ReactNode;
  bannerText?: string | null;
  /** Rendered in the top-right slot (where bannerText renders). Takes precedence over bannerText. */
  cornerBadge?: ReactNode;
  /** When set, replaces the cover-image background + gradient inside the image area; the title overlay and top-right slot still render on top. */
  imageArea?: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const TileBaseComponent: FC<TileBaseProps> = ({
  coverImage: coverImageProp,
  title,
  children,
  bannerText,
  cornerBadge,
  imageArea,
  onClick,
  className = '',
  style,
}) => {
  // Initialize with placeholder immediately to prevent layout shifts
  const [coverImage, setCoverImage] = useState<string>('https://picsum.photos/240/144');
  const { titleBoxRef, titleRef, titleFontSizePx } = useFittingTileTitleFontSize(title);

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
      className={`flex flex-col rounded-2xl overflow-hidden font-medium text-label-primary light ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      <div className="relative h-[230px] flex justify-start items-end">
        {imageArea ? (
          imageArea
        ) : (
          <>
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
          </>
        )}
        {cornerBadge ? (
          <div className="absolute right-3 top-3 z-20 max-w-[80%]">{cornerBadge}</div>
        ) : bannerText ? (
          <div className="absolute right-3 top-3 z-20 max-w-[80%] rounded-full border border-border-primary bg-warning px-3 py-1 text-xs font-semibold text-label-primary shadow-sm">
            {bannerText}
          </div>
        ) : null}
        <div className="absolute inset-0 flex justify-start items-end p-3">
          <div ref={titleBoxRef} className="max-h-[130px] w-full overflow-hidden">
            <span
              ref={titleRef}
              className="block leading-tight text-white"
              style={{ fontSize: titleFontSizePx }}
            >
              {title}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-[201px] justify-between bg-fill-primary text-label-primary p-5">
        {children}
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders that could interfere with Swiper
export const TileBase = memo(TileBaseComponent);
