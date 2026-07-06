import React, { FC, ReactNode, useRef, useState, useEffect } from 'react';
import { Mousewheel } from 'swiper/modules';
import { Swiper, SwiperSlide, SwiperRef } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/mousewheel';
import { useTranslations } from 'next-intl';

import { CourseList_Course } from '../../../queries/__generated__/CourseList';
import { CourseTiles_Course } from '../../../queries/__generated__/CourseTiles';
import { CoursesEnrolledByUser_Course } from '../../../queries/__generated__/CoursesEnrolledByUser';

export type CourseType = CourseList_Course | CourseTiles_Course | CoursesEnrolledByUser_Course;

/** Minimal shape every tile item must expose so the shell can key each slide. */
export interface TileSliderItem {
  id: number | string;
}

interface TileSliderProps<T extends TileSliderItem> {
  items: T[];
  /** Renders the tile content for a single item (course, project, …). */
  renderTile: (item: T) => ReactNode;
  /** Widget embed mode: transparent background, visible overflow, taller nav. */
  isWidget?: boolean;
}

interface NavButtonProps {
  idSuffix: string;
  className: string;
  visible: boolean;
  onClick: () => void;
  imgSrc: string;
  imgAlt: string;
  isWidget?: boolean;
}

const buttonStyles = {
  background:
    'linear-gradient(0deg, rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 0.7)), linear-gradient(270deg, rgba(34, 34, 34, 0.5) 0%, rgba(255, 253, 253, 0) 105.56%)',
};

const NavButton: FC<NavButtonProps> = ({ idSuffix, className, visible, onClick, imgSrc, imgAlt, isWidget = false }) => (
  <button
    id={idSuffix}
    className={`${className} w-10 ${isWidget ? 'h-[435px]' : 'h-[431px]'} ${!visible ? 'hidden' : ''}`}
    style={buttonStyles}
    onClick={onClick}
  >
    <img src={imgSrc} alt={imgAlt} />
  </button>
);

const COMMON_SPACE_BETWEEN = 11;
const COMMON_OFFSET = 12;

const breakpoints = {
  460: { spaceBetween: COMMON_SPACE_BETWEEN, slidesOffsetBefore: COMMON_OFFSET, slidesOffsetAfter: COMMON_OFFSET },
  640: { spaceBetween: COMMON_SPACE_BETWEEN, slidesOffsetBefore: COMMON_OFFSET, slidesOffsetAfter: COMMON_OFFSET },
  768: { spaceBetween: COMMON_SPACE_BETWEEN },
  1024: { spaceBetween: COMMON_SPACE_BETWEEN },
  1280: { spaceBetween: COMMON_SPACE_BETWEEN },
  1536: { spaceBetween: COMMON_SPACE_BETWEEN },
};

/**
 * Shared horizontal tile carousel (Swiper). Content-agnostic: callers supply the
 * items and a `renderTile` callback, so courses, projects, widgets, etc. all reuse
 * the same shell, nav arrows, resize handling and Swiper resilience.
 */
function TileSlider<T extends TileSliderItem>({ items, renderTile, isWidget = false }: TileSliderProps<T>) {
  const t = useTranslations('common');
  const swiperRef = useRef<SwiperRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nextVisible, setNextVisible] = useState(true);
  const [prevVisible, setPrevVisible] = useState(false);
  const [isSwiperReady, setIsSwiperReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const idSuffix = useRef(Date.now().toString()).current; // unique identifier

  const handleSlideChange = () => {
    if (swiperRef.current?.swiper) {
      const swiper = swiperRef.current.swiper;
      setPrevVisible(!swiper.isBeginning);
      setNextVisible(!swiper.isEnd);
    }
  };

  const swiperPrev = () => swiperRef.current?.swiper?.slidePrev();
  const swiperNext = () => swiperRef.current?.swiper?.slideNext();

  const calculateTileWidth = () => {
    const tileWidth = window.innerWidth >= 640 ? 325 : 275; // Tile width based on breakpoint
    return tileWidth;
  };

  useEffect(() => {
    const checkIfAllTilesFit = () => {
      const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 0;
      const tileWidth = calculateTileWidth();
      const totalTileWidth = items.length * tileWidth;
      setNextVisible(totalTileWidth > containerWidth);
    };
    checkIfAllTilesFit();
    window.addEventListener('resize', checkIfAllTilesFit);
    return () => {
      window.removeEventListener('resize', checkIfAllTilesFit);
    };
  }, [items]);

  // Ensure we're on the client side before initializing Swiper
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add a timeout to detect if Swiper fails to initialize
  useEffect(() => {
    if (!isClient) return;

    const timeout = setTimeout(() => {
      if (!isSwiperReady && !hasError) {
        console.warn('Swiper failed to initialize within timeout');
        setHasError(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isSwiperReady, hasError, isClient]);

  // Prevent browser navigation on horizontal scroll
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleWheel = (e: WheelEvent) => {
      // Only prevent default for horizontal scrolling
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Don't render Swiper if no items
  if (!items || items.length === 0) {
    return <div className="relative h-[431px]" ref={containerRef} />;
  }

  // Don't render Swiper until client-side
  if (!isClient) {
    return (
      <div className="relative h-[431px]" ref={containerRef}>
        <div className="animate-pulse bg-gray-200 h-full rounded" />
      </div>
    );
  }

  // If there was an error, render a static fallback grid using the same tiles
  if (hasError) {
    return (
      <div className="relative h-[431px]" ref={containerRef}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-4">{t('tile_slider_unavailable')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.slice(0, 3).map((item) => (
                <div key={item.id}>{renderTile(item)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${isWidget ? 'h-[435px] bg-transparent overflow-hidden' : 'h-[431px]'}`}
      ref={containerRef}
      style={{ overscrollBehaviorX: 'contain' }}
    >
      <Swiper
        className={isWidget ? '!overflow-visible' : ''}
        ref={swiperRef}
        modules={[Mousewheel]}
        breakpoints={breakpoints}
        spaceBetween={COMMON_SPACE_BETWEEN}
        slidesPerView={'auto'}
        slidesOffsetBefore={13}
        slidesOffsetAfter={13}
        onSlideChange={handleSlideChange}
        mousewheel={{
          forceToAxis: true,
          sensitivity: 1,
          releaseOnEdges: false,
        }}
        onInit={(swiper) => {
          try {
            // Ensure swiper is properly initialized
            if (swiper && swiper.params) {
              setIsSwiperReady(true);
            } else {
              console.warn('Swiper initialization failed - params undefined');
              setHasError(true);
            }
          } catch (error) {
            console.error('Swiper initialization error:', error);
            setHasError(true);
          }
        }}
        onSwiper={(swiper) => {
          try {
            // Additional safety check
            if (swiper && swiper.params) {
              // Swiper instance created successfully
            } else {
              console.warn('Swiper instance creation failed - params undefined');
              setHasError(true);
            }
          } catch (error) {
            console.error('Swiper instance creation error:', error);
            setHasError(true);
          }
        }}
      >
        {items.map((item) => (
          <SwiperSlide key={item.id} className="whitespace-normal !h-[431px] !w-[275px] xs:!w-[325px]">
            {renderTile(item)}
          </SwiperSlide>
        ))}
      </Swiper>
      {items.length > 1 && isSwiperReady && (
        <>
          <NavButton
            idSuffix={`prev-${idSuffix}`}
            className="absolute top-0 left-0 z-10"
            visible={prevVisible}
            onClick={swiperPrev}
            imgSrc="/images/common/slider-previous-arrow.svg"
            imgAlt="Previous"
            isWidget={isWidget}
          />
          <NavButton
            idSuffix={`next-${idSuffix}`}
            className="absolute top-0 right-0 z-10"
            visible={nextVisible}
            onClick={swiperNext}
            imgSrc="/images/common/slider-next-arrow.svg"
            imgAlt="Next"
            isWidget={isWidget}
          />
        </>
      )}
    </div>
  );
}

export default TileSlider;
