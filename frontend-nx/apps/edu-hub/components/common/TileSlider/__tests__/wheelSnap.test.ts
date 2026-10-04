import type { Swiper as SwiperInstance } from 'swiper';
import { WheelSnap, WHEEL_GESTURE_IDLE_MS, WHEEL_SNAP_IDLE_MS } from '../wheelSnap';

const originalMatchMedia = window.matchMedia;
let reducedMotion = false;

function createSlider(freeModeEnabled = true, pointerSticky = true) {
  const handlers = new Map<string, Array<(swiper: SwiperInstance, ...args: any[]) => void>>();
  const anyHandlers: Array<(event: string, swiper: SwiperInstance, ...args: any[]) => void> = [];
  const freeMode = { enabled: freeModeEnabled, sticky: pointerSticky };
  const slideToClosest = jest.fn();
  const setTranslate = jest.fn();
  const nativeCommands = jest.fn();
  const swiper = {
    el: document.createElement('div'),
    width: 1152,
    slides: [document.createElement('div'), document.createElement('div')],
    slidesSizesGrid: [325, 325],
    params: { freeMode, speed: 250, mousewheel: { forceToAxis: true, noMousewheelClass: 'swiper-no-mousewheel' } },
    mousewheel: { enabled: true },
    enabled: true,
    destroyed: false,
    isLocked: false,
    animating: false,
    translate: 0,
    slideToClosest,
    setTranslate,
    onAny: (handler: (event: string, swiper: SwiperInstance, ...args: any[]) => void) => {
      anyHandlers.push(handler);
    },
  } as unknown as SwiperInstance;
  const emit = (event: string, ...args: any[]) => {
    anyHandlers.forEach((handler) => handler(event, swiper, ...args));
    handlers.get(event)?.forEach((handler) => handler(swiper, ...args));
  };
  const on = (events: string, handler: (swiper: SwiperInstance, ...args: any[]) => void) => {
    events.split(' ').forEach((event) => {
      handlers.set(event, [...(handlers.get(event) || []), handler]);
    });
    return swiper;
  };

  WheelSnap({
    params: swiper.params,
    swiper,
    extendParams: jest.fn(),
    on: on as SwiperInstance['on'],
    once: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(() => swiper),
  });
  emit('init');

  // A real bubble listener lets capture-phase gesture grouping stop this shim
  // exactly as it stops native Mousewheel. Model only native accepted events:
  // native translation/normal commands happen before the scroll event emits.
  const nativeWheel = jest.fn((event: WheelEvent) => {
    const horizontal = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
    const vertical = event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY;
    if (
      swiper.enabled &&
      !swiper.destroyed &&
      swiper.mousewheel.enabled &&
      !event.ctrlKey &&
      !event.metaKey &&
      !(event.target as Element | null)?.closest('.swiper-no-mousewheel') &&
      Math.abs(horizontal) > Math.abs(vertical)
    ) {
      if (freeMode.enabled) {
        swiper.translate -= horizontal;
        emit('scroll', event);
      } else if (!swiper.animating) {
        nativeCommands(horizontal > 0 ? 'next' : 'previous');
        emit('beforeTransitionStart');
        emit('scroll', event);
      }
    }
  });
  swiper.el.addEventListener('wheel', nativeWheel);

  const wheel = (options: WheelEventInit = {}, target = swiper.el) => {
    const event = new WheelEvent('wheel', {
      deltaX: 24,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    target.dispatchEvent(event);
    return event;
  };

  return { swiper, freeMode, slideToClosest, setTranslate, nativeCommands, nativeWheel, emit, wheel };
}

describe('WheelSnap', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    reducedMotion = false;
    window.matchMedia = jest.fn().mockImplementation(() => ({ matches: reducedMotion }));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('leaves translation native and snaps once after the complete wheel stream is quiet', () => {
    const slider = createSlider();
    const event = slider.wheel({ deltaX: 40 });

    expect(slider.freeMode.sticky).toBe(false);
    expect(slider.swiper.translate).toBe(-40);
    expect(slider.setTranslate).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS - 1);
    expect(slider.slideToClosest).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(slider.slideToClosest).toHaveBeenCalledWith(250, true);
    jest.advanceTimersByTime(1000);
    expect(slider.slideToClosest).toHaveBeenCalledTimes(1);
  });

  it('restarts the same settling timer through small descending momentum-tail events', () => {
    const slider = createSlider();
    [40, 25, 12, 5, 2, 0.5, 0.1].forEach((deltaX) => {
      jest.advanceTimersByTime(32);
      slider.wheel({ deltaX });
      expect(slider.slideToClosest).not.toHaveBeenCalled();
    });

    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS - 1);
    expect(slider.slideToClosest).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(slider.slideToClosest).toHaveBeenCalledTimes(1);
    expect(slider.setTranslate).not.toHaveBeenCalled();
  });

  it('keeps each slider settling timer independent', () => {
    const first = createSlider();
    const second = createSlider();
    first.wheel();
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS / 2);
    second.wheel();

    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS / 2);
    expect(first.slideToClosest).toHaveBeenCalledTimes(1);
    expect(second.slideToClosest).not.toHaveBeenCalled();
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS / 2);
    expect(second.slideToClosest).toHaveBeenCalledTimes(1);
  });

  it('does not schedule a snap for vertical input rejected by native axis filtering', () => {
    const slider = createSlider();
    slider.wheel({ deltaX: 2, deltaY: 40 });
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

    expect(slider.slideToClosest).not.toHaveBeenCalled();
    expect(slider.swiper.translate).toBe(0);
  });

  it.each(['ctrlKey', 'metaKey'])('does not change sticky behavior for %s browser zoom', (modifier) => {
    const slider = createSlider();
    const event = slider.wheel({ [modifier]: true });
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

    expect(slider.freeMode.sticky).toBe(true);
    expect(slider.slideToClosest).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('preserves default touch configuration and cancels wheel grouping when a touch starts', () => {
    const slider = createSlider(false);
    slider.wheel();
    slider.emit('touchStart');
    slider.wheel();
    jest.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS);

    expect(slider.freeMode.enabled).toBe(false);
    expect(slider.freeMode.sticky).toBe(true);
    expect(slider.slideToClosest).not.toHaveBeenCalled();
    expect(slider.nativeCommands).toHaveBeenCalledTimes(2);
  });

  it('does not change sticky behavior while native Mousewheel is disabled', () => {
    const slider = createSlider();
    slider.swiper.mousewheel.enabled = false;
    slider.wheel();
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

    expect(slider.freeMode.sticky).toBe(true);
    expect(slider.slideToClosest).not.toHaveBeenCalled();
  });

  it.each([true, false])('cancels wheel settling and restores pointer sticky=%s on a drag', (pointerSticky) => {
    const slider = createSlider(true, pointerSticky);
    slider.wheel();
    slider.emit('touchStart');
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

    expect(slider.freeMode.sticky).toBe(pointerSticky);
    expect(slider.slideToClosest).not.toHaveBeenCalled();

    slider.wheel();
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);
    expect(slider.slideToClosest).toHaveBeenCalledTimes(1);
  });

  it.each(['beforeTransitionStart', 'beforeResize', 'resize', 'observerUpdate', 'disable'])(
    'cancels a pending snap after %s',
    (event) => {
      const slider = createSlider();
      slider.wheel();
      slider.emit(event);
      jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

      expect(slider.slideToClosest).not.toHaveBeenCalled();
    }
  );

  it.each(['slidesUpdated', 'update'])('preserves pending settling through a same-geometry %s', (event) => {
    const slider = createSlider();
    slider.wheel();
    jest.advanceTimersByTime(80);
    slider.emit(event);
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS - 81);
    expect(slider.slideToClosest).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(slider.slideToClosest).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['slidesUpdated', 'width'],
    ['slidesUpdated', 'slide count'],
    ['slidesUpdated', 'slide identity'],
    ['slidesUpdated', 'slide size'],
    ['slidesUpdated', 'size count'],
    ['update', 'width'],
    ['update', 'slide count'],
    ['update', 'slide identity'],
    ['update', 'slide size'],
    ['update', 'size count'],
  ])('cancels stale settling on %s when the physical %s changes', (event, change) => {
    const slider = createSlider();
    slider.wheel();
    if (change === 'width') slider.swiper.width += 1;
    if (change === 'slide count') slider.swiper.slides.push(document.createElement('div'));
    if (change === 'slide identity') slider.swiper.slides[0] = document.createElement('div');
    if (change === 'slide size') slider.swiper.slidesSizesGrid[0] += 1;
    if (change === 'size count') slider.swiper.slidesSizesGrid.pop();
    slider.emit(event);
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

    expect(slider.slideToClosest).not.toHaveBeenCalled();
  });

  it('cancels pending settling and removes its capture listener on destruction', () => {
    const slider = createSlider();
    slider.wheel();
    slider.emit('beforeDestroy');
    slider.swiper.destroyed = true;
    slider.freeMode.sticky = true;
    slider.wheel();
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

    expect(slider.freeMode.sticky).toBe(true);
    expect(slider.slideToClosest).not.toHaveBeenCalled();
  });

  it.each(['destroyed', 'disabled', 'locked', 'free mode disabled', 'mousewheel disabled'])(
    'rechecks %s state before an already queued snap',
    (state) => {
      const slider = createSlider();
      slider.wheel();
      if (state === 'destroyed') slider.swiper.destroyed = true;
      if (state === 'disabled') slider.swiper.enabled = false;
      if (state === 'locked') slider.swiper.isLocked = true;
      if (state === 'free mode disabled') slider.freeMode.enabled = false;
      if (state === 'mousewheel disabled') slider.swiper.mousewheel.enabled = false;
      jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

      expect(slider.slideToClosest).not.toHaveBeenCalled();
    }
  );

  it('honors reduced motion for the final native snap', () => {
    reducedMotion = true;
    const slider = createSlider();
    slider.wheel();
    jest.advanceTimersByTime(WHEEL_SNAP_IDLE_MS);

    expect(slider.slideToClosest).toHaveBeenCalledWith(0, true);
  });

  describe('normal-mode wheel gesture grouping', () => {
    it('uses a 100ms free-mode settling delay and a separate 250ms gesture boundary', () => {
      expect(WHEEL_SNAP_IDLE_MS).toBe(100);
      expect(WHEEL_GESTURE_IDLE_MS).toBe(250);
    });

    it('allows one native card command for a long gesture and a new command after its tail is quiet', () => {
      const slider = createSlider(false);
      const first = slider.wheel({ deltaX: 100 });
      expect(first.defaultPrevented).toBe(false);
      [80, 70, 25, 5, 0.1].forEach((deltaX) => {
        jest.advanceTimersByTime(48);
        expect(slider.wheel({ deltaX }).defaultPrevented).toBe(true);
      });

      expect(slider.nativeWheel).toHaveBeenCalledTimes(1);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS - 1);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1);
      expect(slider.wheel({ deltaX: 25 }).defaultPrevented).toBe(false);

      expect(slider.nativeCommands).toHaveBeenCalledTimes(2);
      expect(slider.slideToClosest).not.toHaveBeenCalled();
      expect(slider.setTranslate).not.toHaveBeenCalled();
    });

    it('groups direction changes within the same uninterrupted wheel stream', () => {
      const slider = createSlider(false);
      slider.wheel({ deltaX: 40 });
      expect(slider.wheel({ deltaX: -40 }).defaultPrevented).toBe(true);

      expect(slider.nativeCommands).toHaveBeenCalledTimes(1);
      expect(slider.nativeCommands).toHaveBeenCalledWith('next');
      jest.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS);
      slider.wheel({ deltaX: -40 });
      expect(slider.nativeCommands).toHaveBeenLastCalledWith('previous');
    });

    it('does not consume a gesture until native navigation accepts an event after animation', () => {
      const slider = createSlider(false);
      slider.swiper.animating = true;
      expect(slider.wheel().defaultPrevented).toBe(false);
      jest.advanceTimersByTime(80);
      expect(slider.wheel().defaultPrevented).toBe(false);
      expect(slider.nativeCommands).not.toHaveBeenCalled();

      slider.swiper.animating = false;
      expect(slider.wheel().defaultPrevented).toBe(false);
      expect(slider.wheel().defaultPrevented).toBe(true);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(1);
    });

    it.each(['vertical', 'ctrlKey', 'metaKey'])(
      'does not block %s input or let it extend the horizontal gesture gate',
      (input) => {
        const slider = createSlider(false);
        slider.wheel();
        jest.advanceTimersByTime(200);
        const options = input === 'vertical' ? { deltaX: 2, deltaY: 40 } : { [input]: true };
        expect(slider.wheel(options).defaultPrevented).toBe(false);
        expect(slider.nativeWheel).toHaveBeenCalledTimes(2);
        expect(slider.nativeCommands).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS - 200);
        slider.wheel();
        expect(slider.nativeCommands).toHaveBeenCalledTimes(2);
      }
    );

    it('groups Shift plus vertical wheels as native horizontal navigation', () => {
      const slider = createSlider(false);
      slider.wheel({ deltaX: 0, deltaY: 30, shiftKey: true });
      const tail = slider.wheel({ deltaX: 0, deltaY: 10, shiftKey: true });

      expect(tail.defaultPrevented).toBe(true);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(1);
      expect(slider.nativeCommands).toHaveBeenCalledWith('next');
    });

    it('does not group wheel events from the native no-mousewheel subtree', () => {
      const slider = createSlider(false);
      const ignored = document.createElement('div');
      ignored.className = 'swiper-no-mousewheel';
      slider.swiper.el.append(ignored);
      slider.wheel();
      jest.advanceTimersByTime(200);
      expect(slider.wheel({}, ignored).defaultPrevented).toBe(false);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS - 200);
      slider.wheel();
      expect(slider.nativeCommands).toHaveBeenCalledTimes(2);
    });

    it('keeps normal-mode gesture boundaries independent across multiple sliders', () => {
      const first = createSlider(false);
      const second = createSlider(false);
      first.wheel();
      jest.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS / 2);
      second.wheel();
      jest.advanceTimersByTime(WHEEL_GESTURE_IDLE_MS / 2);

      expect(first.wheel().defaultPrevented).toBe(false);
      expect(second.wheel().defaultPrevented).toBe(true);
      expect(first.nativeCommands).toHaveBeenCalledTimes(2);
      expect(second.nativeCommands).toHaveBeenCalledTimes(1);
    });

    it.each(['beforeTransitionStart', 'beforeResize', 'resize', 'observerUpdate', 'disable', 'touchStart'])(
      'clears the old wheel gesture gate after %s',
      (event) => {
        const slider = createSlider(false);
        slider.wheel();
        slider.emit(event);
        expect(slider.wheel().defaultPrevented).toBe(false);

        expect(slider.nativeCommands).toHaveBeenCalledTimes(2);
      }
    );

    it.each(['slidesUpdated', 'update'])('keeps the gesture gate for a same-geometry %s', (event) => {
      const slider = createSlider(false);
      slider.wheel();
      slider.emit(event);
      expect(slider.wheel().defaultPrevented).toBe(true);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(1);
    });

    it.each(['slidesUpdated', 'update'])('clears the gate when %s reports new card identities', (event) => {
      const slider = createSlider(false);
      slider.wheel();
      slider.swiper.slides[0] = document.createElement('div');
      slider.emit(event);
      expect(slider.wheel().defaultPrevented).toBe(false);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(2);
    });

    it('removes normal-mode wheel grouping on destruction', () => {
      const slider = createSlider(false);
      slider.wheel();
      slider.emit('beforeDestroy');

      // Leave the native test shim active to detect a leftover capture listener.
      expect(slider.wheel().defaultPrevented).toBe(false);
      expect(slider.wheel().defaultPrevented).toBe(false);
      expect(slider.nativeCommands).toHaveBeenCalledTimes(3);
    });
  });
});
