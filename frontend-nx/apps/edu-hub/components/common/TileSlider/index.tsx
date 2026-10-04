import React, { FC, ReactNode, useCallback, useRef, useState, useEffect } from 'react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import { Swiper, SwiperSlide, SwiperRef } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/mousewheel';
import { useTranslations } from 'next-intl';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

import { CourseList_Course } from '../../../queries/__generated__/CourseList';
import { CourseTiles_Course } from '../../../queries/__generated__/CourseTiles';
import { CoursesEnrolledByUser_Course } from '../../../queries/__generated__/CoursesEnrolledByUser';
import { desktopSnapGrid, desktopTileWidth, NAVIGATION_WIDTH, TILE_GAP } from './desktopLayout';
import { MOBILE_EDGE_OFFSET, mobileSnapGrid } from './mobileLayout';
import { WheelSnap } from './wheelSnap';

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
  label: string;
  direction: 'previous' | 'next';
  gradientWidth: number;
  isWidget?: boolean;
}

// Cubic Hermite smoothstep(0, 1, t) = t * t * (3 - 2 * t).
// Generate 32 samples of 0.75 * (1 - smoothstep) once at module load to
// reduce slope changes between CSS stops without changing the fade's profile.
const NAVIGATION_GRADIENT_STOPS = Array.from({ length: 32 }, (_, index) => {
  const t = index / 31;
  const opacity = 0.75 * (1 - t * t * (3 - 2 * t));
  return `rgba(15, 15, 15, ${opacity.toFixed(5)}) ${(t * 100).toFixed(4)}%`;
}).join(', ');

const NavButton: FC<NavButtonProps> = ({
  idSuffix,
  className,
  visible,
  onClick,
  label,
  direction,
  gradientWidth,
  isWidget = false,
}) => (
  <button
    id={idSuffix}
    type="button"
    className={`${className} flex w-12 items-center justify-center rounded-none bg-transparent transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white ${isWidget ? 'h-[435px]' : 'h-[431px]'} ${!visible ? 'pointer-events-none opacity-0' : ''}`}
    onClick={(event) => {
      // Swiper prevents the click following a drag, even if the card snaps back.
      if (!event.defaultPrevented) onClick();
    }}
    disabled={!visible}
    aria-label={label}
    data-tile-slider-nav
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 ${direction === 'previous' ? 'left-0' : 'right-0'}`}
      style={{
        width: gradientWidth,
        background: `linear-gradient(${direction === 'previous' ? '90deg' : '270deg'}, ${NAVIGATION_GRADIENT_STOPS})`,
      }}
    />
    <svg
      className={`relative pointer-events-none select-none block h-6 w-6 ${direction === 'previous' ? '-translate-x-1.5' : 'translate-x-1.5'}`}
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.65))' }}
      viewBox="0 0 31 62"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          direction === 'previous'
            ? 'M25.9817 58.9287L6.95209 31L25.9817 3.07136'
            : 'M4.95209 3.07129L23.9817 31L4.95209 58.9286'
        }
        stroke="#F2F2F2"
        strokeWidth="10"
      />
    </svg>
  </button>
);

const MOBILE_BREAKPOINT = 768;

/**
 * Shared horizontal tile carousel (Swiper). Content-agnostic: callers supply the
 * items and a `renderTile` callback, so courses, projects, widgets, etc. all reuse
 * the same shell, nav arrows, resize handling and Swiper resilience.
 */
function TileSlider<T extends TileSliderItem>({ items, renderTile, isWidget = false }: TileSliderProps<T>) {
  const t = useTranslations('common');
  const swiperRef = useRef<SwiperRef | null>(null);
  const activeSlide = useRef(0);
  const restoringSlide = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nextVisible, setNextVisible] = useState(true);
  const [prevVisible, setPrevVisible] = useState(false);
  const [isSwiperReady, setIsSwiperReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const isMobileLayout = containerWidth < MOBILE_BREAKPOINT;
  const isDesktopViewport = useMediaQuery(`(min-width: ${MOBILE_BREAKPOINT}px)`);
  // Card browsing follows container width; homepage edge alignment follows the
  // page's content grid. Narrow widgets retain their own mobile inset.
  const edgeOffset = isMobileLayout && (isWidget || !isDesktopViewport) ? MOBILE_EDGE_OFFSET : 0;
  const tileWidth = desktopTileWidth(containerWidth, items.length);
  const gradientWidth = isMobileLayout
    ? NAVIGATION_WIDTH
    : desktopSnapGrid(containerWidth, tileWidth, items.length).gradientWidth;
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

  const alignSlides = (swiper: SwiperInstance) => {
    if (!swiper.slides.length) return;

    if (swiper.params.centeredSlides) {
      swiper.snapGrid = mobileSnapGrid(
        swiper.width,
        swiper.slidesSizesGrid[0],
        swiper.slides.length,
        swiper.snapGrid,
        edgeOffset
      );
      return;
    }

    // Swiper has measured the container and cards. Only adjust resting snap
    // positions; its gestures, transitions, edge state and controls stay native.
    const grids = desktopSnapGrid(swiper.width, swiper.slidesSizesGrid[0], swiper.slides.length);
    swiper.slidesGrid = grids.slidesGrid;
    swiper.snapGrid = grids.snapGrid;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateLayout = () => setContainerWidth(container.clientWidth);
    const resizeObserver = new ResizeObserver(updateLayout);
    updateLayout();
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [isClient]);

  useEffect(() => {
    const swiper = swiperRef.current?.swiper;
    if (!swiper || swiper.destroyed) return;

    swiper.update();
    // A viewport mode change may mount before ResizeObserver reports the new
    // container width. Restore selection only after its card layout is current.
    if (restoringSlide.current && containerWidth === swiper.width) {
      restoringSlide.current = false;
      swiper.slideTo(Math.min(activeSlide.current, items.length - 1), 0);
    }
    if (swiper.activeIndex >= items.length) {
      swiper.slideTo(Math.max(items.length - 1, 0), 0);
    }
    syncNavigation();
  }, [items, containerWidth, edgeOffset, isDesktopViewport, syncNavigation]);

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
      onWheelCapture={(event) => {
        // Native Mousewheel must not consume horizontal browser pinch/zoom.
        if (event.ctrlKey || event.metaKey) event.stopPropagation();
      }}
    >
      <Swiper
        // Reinitialize only when input mode changes: native sticky timers and
        // free-mode CSS classes otherwise survive dynamic parameter changes.
        key={isDesktopViewport ? 'desktop' : 'mobile'}
        className="h-full"
        ref={swiperRef}
        initialSlide={Math.min(activeSlide.current, items.length - 1)}
        modules={[Mousewheel, FreeMode, WheelSnap]}
        // Input mode follows the viewport, not narrow widget/container widths.
        // WheelSnap settles free scrolling and groups normal-mode wheel input;
        // pointer drags stay native, and mobile keeps default snapping mode.
        freeMode={{ enabled: isDesktopViewport, sticky: true }}
        speed={250}
        longSwipesRatio={0.35}
        touchEventsTarget="container"
        focusableElements="input, select, option, textarea, button:not([data-tile-slider-nav]), video, label"
        spaceBetween={TILE_GAP}
        slidesPerView="auto"
        // Desktop edges are flush; only mobile layouts need an internal inset.
        slidesOffsetBefore={edgeOffset}
        slidesOffsetAfter={edgeOffset}
        centeredSlides={isMobileLayout}
        centeredSlidesBounds={isMobileLayout}
        watchOverflow
        observer
        observeParents
        onSlidesUpdated={alignSlides}
        onSlideChange={(swiper) => {
          // Ignore the outgoing instance's resize realignment while its input
          // mode no longer matches the viewport, before React remounts it.
          if (
            !restoringSlide.current &&
            window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`).matches === isDesktopViewport
          ) {
            activeSlide.current = swiper.activeIndex;
          }
          syncNavigation();
        }}
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
        onBeforeInit={() => {
          restoringSlide.current = true;
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
            className="flex !h-[431px] justify-center whitespace-normal"
            style={{ width: isMobileLayout ? 'min(325px, calc(100% - 96px))' : tileWidth }}
          >
            <div className="h-full w-full">{renderTile(item)}</div>
          </SwiperSlide>
        ))}
        {items.length > 1 && isSwiperReady && (
          <div slot="container-end">
            <NavButton
              idSuffix={`prev-${idSuffix}`}
              className="absolute top-0 left-0 z-10"
              visible={prevVisible}
              onClick={swiperPrev}
              label={t('tile_slider_previous')}
              direction="previous"
              gradientWidth={gradientWidth}
              isWidget={isWidget}
            />
            <NavButton
              idSuffix={`next-${idSuffix}`}
              className="absolute top-0 right-0 z-10"
              visible={nextVisible}
              onClick={swiperNext}
              label={t('tile_slider_next')}
              direction="next"
              gradientWidth={gradientWidth}
              isWidget={isWidget}
            />
          </div>
        )}
      </Swiper>
    </div>
  );
}

export default TileSlider;
