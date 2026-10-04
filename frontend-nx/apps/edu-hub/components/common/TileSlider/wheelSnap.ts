import type { SwiperModule } from 'swiper/types';

export const WHEEL_SNAP_IDLE_MS = 100;
export const WHEEL_GESTURE_IDLE_MS = 250;

/** Keep native free scrolling; group normal-mode wheel input into one card move. */
export const WheelSnap: SwiperModule = ({ swiper, on }) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let wheelGestureConsumed = false;
  let pointerSticky: boolean | undefined;
  let layout: { width: number; slides: HTMLElement[]; sizes: number[] } | undefined;

  const freeMode = () => {
    const options = swiper.params.freeMode;
    return typeof options === 'object' && options.enabled ? options : undefined;
  };

  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
    wheelGestureConsumed = false;
    layout = undefined;
  };

  const extendWheelGesture = () => {
    clearTimeout(timer);
    timer = setTimeout(cancel, WHEEL_GESTURE_IDLE_MS);
  };

  const prepareWheel = (event: WheelEvent) => {
    if (swiper.destroyed || !swiper.enabled || !swiper.mousewheel.enabled || event.ctrlKey || event.metaKey) return;
    const mousewheel = swiper.params.mousewheel;
    const ignoredClass = typeof mousewheel === 'object' ? mousewheel.noMousewheelClass : undefined;
    if (ignoredClass && (event.target as Element | null)?.closest?.(`.${ignoredClass}`)) return;

    // Match native forceToAxis filtering, including Shift + vertical wheel.
    const shiftHorizontal = event.shiftKey && event.deltaX === 0;
    const horizontal = shiftHorizontal ? event.deltaY : event.deltaX;
    const vertical = shiftHorizontal ? 0 : event.deltaY;
    if (Math.abs(horizontal) <= Math.abs(vertical)) return;

    const options = freeMode();
    if (!options) {
      // Native normal-mode Mousewheel interprets momentum tails as further card
      // commands. Allow its first actual command, then consume the whole tail.
      if (wheelGestureConsumed) {
        extendWheelGesture();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }

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
    if (!swiper.enabled || !swiper.mousewheel.enabled || event.ctrlKey || event.metaKey) return;
    // Native Mousewheel emits this only for wheel input accepted by its axis
    // filter. Every accepted tail event restarts the same per-instance timer.
    cancel();
    layout = { width: swiper.width, slides: [...swiper.slides], sizes: [...swiper.slidesSizesGrid] };
    if (!freeMode()) {
      // scroll confirms native navigation, so an event ignored during an
      // existing animation does not prematurely consume the next gesture.
      wheelGestureConsumed = true;
      extendWheelGesture();
      return;
    }
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
