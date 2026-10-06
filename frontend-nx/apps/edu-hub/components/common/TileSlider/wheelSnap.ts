import type { SwiperModule } from 'swiper/types';

export const WHEEL_SNAP_IDLE_MS = 100;

/** Settle native free scrolling without changing normal-mode wheel input. */
export const WheelSnap: SwiperModule = ({ swiper, on }) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pointerSticky: boolean | undefined;
  let layout: { width: number; slides: HTMLElement[]; sizes: number[] } | undefined;

  const freeMode = () => {
    const options = swiper.params.freeMode;
    return typeof options === 'object' && options.enabled ? options : undefined;
  };

  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
    layout = undefined;
  };

  const prepareWheel = (event: WheelEvent) => {
    if (swiper.destroyed || !swiper.enabled || !swiper.mousewheel.enabled || event.ctrlKey || event.metaKey) return;
    const options = freeMode();
    if (!options) return;
    const mousewheel = swiper.params.mousewheel;
    const ignoredClass = typeof mousewheel === 'object' ? mousewheel.noMousewheelClass : undefined;
    if (ignoredClass && (event.target as Element | null)?.closest?.(`.${ignoredClass}`)) return;

    // Match native forceToAxis filtering, including Shift + vertical wheel.
    const shiftHorizontal = event.shiftKey && event.deltaX === 0;
    const horizontal = shiftHorizontal ? event.deltaY : event.deltaX;
    const vertical = shiftHorizontal ? 0 : event.deltaY;
    if (Math.abs(horizontal) <= Math.abs(vertical)) return;

    // Capture runs before native Mousewheel. Its predictive sticky snap can be
    // interrupted by a stronger trailing event, causing two settling motions.
    // Disable only that heuristic; native normalization/translation stay intact.
    options.sticky = false;
  };

  on('init', () => {
    const options = freeMode();
    pointerSticky = options?.sticky;
    swiper.el.addEventListener('wheel', prepareWheel, { capture: true, passive: false });
  });

  on('scroll', (_swiper, event: WheelEvent) => {
    if (!freeMode() || !swiper.enabled || !swiper.mousewheel.enabled || event.ctrlKey || event.metaKey) return;
    // Native Mousewheel emits this only for wheel input accepted by its axis
    // filter. Every accepted tail event restarts the same per-instance timer.
    cancel();
    layout = { width: swiper.width, slides: [...swiper.slides], sizes: [...swiper.slidesSizesGrid] };
    timer = setTimeout(() => {
      timer = undefined;
      layout = undefined;
      if (swiper.destroyed || !swiper.enabled || !swiper.mousewheel.enabled || swiper.isLocked || !freeMode()) return;
      const speed = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : swiper.params.speed;
      swiper.slideToClosest(speed, true);
    }, WHEEL_SNAP_IDLE_MS);
  });

  on('touchStart', () => {
    cancel();
    const options = freeMode();
    // Pointer/touch drags retain FreeMode's own sticky release behavior.
    // Default-mode touchscreen gestures stay under native Swiper control.
    if (options) options.sticky = pointerSticky;
  });

  const checkLayout = () => {
    const previous = layout;
    if (!previous) return;
    // Image loads may call update() without changing layout. Keep their final
    // snap, but cancel stale wheel work when cards or physical geometry change.
    if (
      swiper.width !== previous.width ||
      swiper.slides.length !== previous.slides.length ||
      swiper.slidesSizesGrid.length !== previous.sizes.length ||
      swiper.slides.some((slide, index) => slide !== previous.slides[index]) ||
      swiper.slidesSizesGrid.some((size, index) => size !== previous.sizes[index])
    ) {
      cancel();
    }
  };
  on('slidesUpdated', checkLayout);
  on('update', checkLayout);

  on('beforeTransitionStart', cancel);
  on('beforeResize', cancel);
  on('resize', cancel);
  on('observerUpdate', cancel);
  // Core emits disable, but this event is absent from Swiper's event typings.
  swiper.onAny((event) => {
    if (event === 'disable') cancel();
  });
  on('beforeDestroy', () => {
    cancel();
    swiper.el.removeEventListener('wheel', prepareWheel, true);
  });
};
