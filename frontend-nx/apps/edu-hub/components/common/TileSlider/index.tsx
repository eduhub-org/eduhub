import React, { FC, ReactNode, useCallback, useRef, useState, useEffect } from 'react';
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
  /** Widget embed mode: transparent background and taller navigation. */
  isWidget?: boolean;
}

interface NavButtonProps {
  idSuffix: string;
  className: string;
  visible: boolean;
  onClick: () => void;
  imgSrc: string;
  label: string;
  direction: 'previous' | 'next';
  isWidget?: boolean;
}

const NavButton: FC<NavButtonProps> = ({
  idSuffix,
  className,
  visible,
  onClick,
  imgSrc,
  label,
  direction,
  isWidget = false,
}) => (
  <button
    id={idSuffix}
    type="button"
    className={`${className} flex w-12 items-center justify-center ${direction === 'previous' ? 'rounded-l-none rounded-r-2xl' : 'rounded-r-none rounded-l-2xl'} bg-transparent transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white ${isWidget ? 'h-[435px]' : 'h-[431px]'} ${!visible ? 'pointer-events-none opacity-0' : ''}`}
    style={{
      background: `linear-gradient(${direction === 'previous' ? '90deg' : '270deg'}, rgba(15, 15, 15, 0.45), rgba(15, 15, 15, 0))`,
    }}
    onClick={onClick}
    disabled={!visible}
    aria-label={label}
  >
    <img
      className={`block h-6 w-6 ${direction === 'previous' ? '-translate-x-1.5' : 'translate-x-1.5'}`}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.65))' }}
      src={imgSrc}
      alt=""
      aria-hidden="true"
    />
  </button>
);

const COMMON_SPACE_BETWEEN = 11;
const COMMON_EDGE_OFFSET = 12;
const MOBILE_BREAKPOINT = 768;

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
  const [isMobileLayout, setIsMobileLayout] = useState(true);
  const idSuffix = useRef(Date.now().toString()).current; // unique identifier

  const syncNavigation = useCallback(() => {
    const swiper = swiperRef.current?.swiper;
    if (!swiper || swiper.destroyed) return;

    const canNavigate = !swiper.isLocked && items.length > 1;
    setPrevVisible(canNavigate && !swiper.isBeginning);
    setNextVisible(canNavigate && !swiper.isEnd);
  }, [items.length]);

  const swiperPrev = () => swiperRef.current?.swiper?.slidePrev();
  const swiperNext = () => swiperRef.current?.swiper?.slideNext();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateLayout = () => setIsMobileLayout(container.clientWidth < MOBILE_BREAKPOINT);
    const resizeObserver = new ResizeObserver(updateLayout);
    updateLayout();
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [isClient]);

  useEffect(() => {
    const swiper = swiperRef.current?.swiper;
    if (!swiper || swiper.destroyed) return;

    swiper.update();
    if (swiper.activeIndex >= items.length) {
      swiper.slideTo(Math.max(items.length - 1, 0), 0);
    }
    syncNavigation();
  }, [items, isMobileLayout, syncNavigation]);

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
      className={`relative overflow-hidden ${isWidget ? 'h-[435px] bg-transparent' : 'h-[431px]'}`}
      ref={containerRef}
      style={{ overscrollBehaviorX: 'contain' }}
      data-tile-slider
    >
      <Swiper
        className="h-full"
        ref={swiperRef}
        modules={[Mousewheel]}
        spaceBetween={COMMON_SPACE_BETWEEN}
        slidesPerView="auto"
        slidesOffsetBefore={COMMON_EDGE_OFFSET}
        slidesOffsetAfter={COMMON_EDGE_OFFSET}
        centeredSlides={isMobileLayout}
        centeredSlidesBounds={isMobileLayout}
        watchOverflow
        observer
        observeParents
        onSlideChange={syncNavigation}
        onReachBeginning={syncNavigation}
        onReachEnd={syncNavigation}
        onFromEdge={syncNavigation}
        onResize={syncNavigation}
        onUpdate={syncNavigation}
        mousewheel={{
          forceToAxis: true,
          sensitivity: 1,
          releaseOnEdges: false,
        }}
        onInit={(swiper) => {
          try {
            if (swiper && swiper.params) {
              setIsSwiperReady(true);
              requestAnimationFrame(syncNavigation);
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
            if (!swiper || !swiper.params) {
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
          <SwiperSlide
            key={item.id}
            className={`flex !h-[431px] justify-center whitespace-normal ${isMobileLayout ? '' : '!w-[325px]'}`}
            style={isMobileLayout ? { width: 'min(325px, calc(100% - 96px))' } : undefined}
          >
            <div className="h-full w-full">{renderTile(item)}</div>
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
            label={t('tile_slider_previous')}
            direction="previous"
            isWidget={isWidget}
          />
          <NavButton
            idSuffix={`next-${idSuffix}`}
            className="absolute top-0 right-0 z-10"
            visible={nextVisible}
            onClick={swiperNext}
            imgSrc="/images/common/slider-next-arrow.svg"
            label={t('tile_slider_next')}
            direction="next"
            isWidget={isWidget}
          />
        </>
      )}
    </div>
  );
}

export default TileSlider;
