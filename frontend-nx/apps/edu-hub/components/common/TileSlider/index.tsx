import React, { FC, useRef, useState, memo, useEffect } from 'react';
import { Navigation, Mousewheel } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/mousewheel';
import { useTranslations, useLocale } from 'next-intl';

import { CourseList_Course } from '../../../queries/__generated__/CourseList';
import { CourseTiles_Course } from '../../../queries/__generated__/CourseTiles';
import { CoursesEnrolledByUser_Course } from '../../../queries/__generated__/CoursesEnrolledByUser';
import { Tile } from './Tile';
import { TileWidget } from './TileWidget';

import sliderNextArrow from '../../../public/images/common/slider-next-arrow.svg';
import sliderPreviousArrow from '../../../public/images/common/slider-previous-arrow.svg';

type CourseType = CourseList_Course | CourseTiles_Course | CoursesEnrolledByUser_Course;

interface TileSliderProps {
  courses: CourseType[];
  isManage: boolean;
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

const LazyTile = memo(Tile);
const LazyTileWidget = memo(TileWidget);
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

const TileSlider: FC<TileSliderProps> = ({ courses, isManage, isWidget = false }) => {
  const t = useTranslations('common');
  const swiperRef = useRef(null);
  const containerRef = useRef(null);
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
      const totalTileWidth = courses.length * tileWidth;
      setNextVisible(totalTileWidth > containerWidth);
    };
    checkIfAllTilesFit();
    window.addEventListener('resize', checkIfAllTilesFit);
    return () => {
      window.removeEventListener('resize', checkIfAllTilesFit);
    };
  }, [courses]);

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

  // Don't render Swiper if no courses
  if (!courses || courses.length === 0) {
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

  // If there was an error, render a fallback
  if (hasError) {
    return (
      <div className="relative h-[431px]" ref={containerRef}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-4">{t('tile_slider_unavailable')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-sm text-gray-600">{course.tagline || t('no_description_available')}</p>
                </div>
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
        modules={[Navigation, Mousewheel]}
        breakpoints={breakpoints}
        spaceBetween={COMMON_SPACE_BETWEEN}
        slidesPerView={'auto'}
        slidesOffsetBefore={13}
        slidesOffsetAfter={13}
        onSlideChange={handleSlideChange}
        navigation
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
        {courses.map((course) => (
          <SwiperSlide key={course.id} className="whitespace-normal !h-[431px] !w-[275px] xs:!w-[325px]">
            {isWidget ? (
              <LazyTileWidget course={course} />
            ) : (
              <LazyTile course={course} isManage={isManage} />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      {courses.length > 1 && isSwiperReady && (
        <>
          <NavButton
            idSuffix={`prev-${idSuffix}`}
            className="absolute top-0 left-0 z-10"
            visible={prevVisible}
            onClick={swiperPrev}
            imgSrc={sliderPreviousArrow}
            imgAlt="Previous"
            isWidget={isWidget}
          />
          <NavButton
            idSuffix={`next-${idSuffix}`}
            className="absolute top-0 right-0 z-10"
            visible={nextVisible}
            onClick={swiperNext}
            imgSrc={sliderNextArrow}
            imgAlt="Next"
            isWidget={isWidget}
          />
        </>
      )}
    </div>
  );
};

export default TileSlider;
