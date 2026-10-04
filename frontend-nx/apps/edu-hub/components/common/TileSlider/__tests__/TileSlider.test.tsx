import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Swiper as SwiperInstance } from 'swiper';
import { FreeMode, Mousewheel } from 'swiper/modules';
import TileSlider from '..';
import { WheelSnap } from '../wheelSnap';

const mockSwiperProps = jest.fn();
const mockWheelHandler = jest.fn();
const mockSwiperInstances: SwiperInstance[] = [];
const originalResizeObserver = window.ResizeObserver;
const originalMatchMedia = window.matchMedia;
let mockDesktopViewport = true;
let mockContainerWidth = 1152;
let mockInitialRealignedIndex: number | null = null;
let mockResizeCallback: () => void;

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../../../../hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockDesktopViewport,
}));

jest.mock('swiper/modules', () => ({
  FreeMode: jest.fn(),
  Mousewheel: jest.fn(),
}));

jest.mock('swiper/css', () => ({}));
jest.mock('swiper/css/free-mode', () => ({}));
jest.mock('swiper/css/mousewheel', () => ({}));

jest.mock('swiper/react', () => {
  const React = require('react') as typeof import('react');
  const Swiper = React.forwardRef(function MockSwiper(props: any, ref) {
    const [instance] = React.useState(() => {
      const swiper = {
        activeIndex: props.initialSlide,
        width: mockContainerWidth,
        destroyed: false,
        isLocked: false,
        isBeginning: props.initialSlide === 0,
        isEnd: false,
        params: props,
        slideNext: jest.fn(),
        slidePrev: jest.fn(),
      } as unknown as SwiperInstance;
      swiper.update = jest.fn(() => {
        swiper.width = mockContainerWidth;
      });
      swiper.slideTo = jest.fn((index) => {
        swiper.activeIndex = index;
        swiper.isBeginning = index === 0;
        props.onSlideChange(swiper);
        return true;
      });
      return swiper;
    });
    mockSwiperProps(props);
    React.useImperativeHandle(ref, () => ({ swiper: instance }), [instance]);
    React.useLayoutEffect(() => {
      props.onBeforeInit(instance);
      mockSwiperInstances.push(instance);
      if (mockInitialRealignedIndex !== null) instance.activeIndex = mockInitialRealignedIndex;
      props.onSlideChange(instance);
      props.onInit(instance);
      props.onSwiper(instance);
      // This mock models one Swiper lifecycle per keyed component mount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <div data-testid="swiper" onWheel={mockWheelHandler}>
        {props.children}
      </div>
    );
  });
  return {
    Swiper,
    SwiperSlide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const items = Array.from({ length: 6 }, (_, id) => ({ id }));
const renderTile = (item: { id: number }) => <span>Tile {item.id}</span>;
const latestProps = () => mockSwiperProps.mock.calls[mockSwiperProps.mock.calls.length - 1][0];

describe('TileSlider input modes', () => {
  beforeEach(() => {
    mockDesktopViewport = true;
    mockContainerWidth = 1152;
    mockInitialRealignedIndex = null;
    mockSwiperProps.mockClear();
    mockWheelHandler.mockClear();
    mockSwiperInstances.length = 0;
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => mockContainerWidth);
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    window.ResizeObserver = jest.fn().mockImplementation((callback) => {
      mockResizeCallback = callback;
      return { observe: jest.fn(), disconnect: jest.fn() };
    });
    window.matchMedia = jest.fn().mockImplementation((query) => ({ matches: mockDesktopViewport, media: query }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.ResizeObserver = originalResizeObserver;
    window.matchMedia = originalMatchMedia;
  });

  it('uses native continuous free mode with quiet-tail snapping in a desktop viewport', () => {
    render(<TileSlider items={items} renderTile={renderTile} />);

    expect(latestProps().modules).toEqual([Mousewheel, FreeMode, WheelSnap]);
    expect(latestProps().freeMode).toEqual({ enabled: true, sticky: true });
    expect(latestProps().mousewheel).toEqual({ forceToAxis: true, sensitivity: 1, releaseOnEdges: false });
  });

  it('retains default mobile snapping and the approved touch timing', () => {
    mockDesktopViewport = false;
    mockContainerWidth = 390;
    render(<TileSlider items={items} renderTile={renderTile} />);

    expect(latestProps().freeMode.enabled).toBe(false);
    expect(latestProps().speed).toBe(250);
    expect(latestProps().longSwipesRatio).toBe(0.35);
    expect(latestProps().touchEventsTarget).toBe('container');
    expect(latestProps().centeredSlides).toBe(true);
  });

  it('keeps desktop free mode in a narrow widget without changing its mobile layout', () => {
    mockContainerWidth = 320;
    render(<TileSlider items={items} renderTile={renderTile} isWidget />);

    expect(latestProps().freeMode.enabled).toBe(true);
    expect(latestProps().centeredSlides).toBe(true);
    expect(latestProps().slidesOffsetBefore).toBe(12);
    expect(latestProps().slidesOffsetAfter).toBe(12);
  });

  it('reinitializes native input mode on viewport changes while preserving the selected card', () => {
    const { rerender } = render(<TileSlider items={items} renderTile={renderTile} />);
    act(() => {
      mockSwiperInstances[0].activeIndex = 3;
      latestProps().onSlideChange(mockSwiperInstances[0]);
    });

    mockDesktopViewport = false;
    rerender(<TileSlider items={items} renderTile={renderTile} />);

    expect(mockSwiperInstances).toHaveLength(2);
    expect(mockSwiperInstances[1].activeIndex).toBe(3);
    expect(latestProps().freeMode.enabled).toBe(false);

    mockDesktopViewport = true;
    rerender(<TileSlider items={items} renderTile={renderTile} />);
    expect(mockSwiperInstances).toHaveLength(3);
    expect(mockSwiperInstances[2].activeIndex).toBe(3);
    expect(latestProps().freeMode.enabled).toBe(true);
  });

  it('updates narrow-container layout without reinitializing the desktop input mode', () => {
    render(<TileSlider items={items} renderTile={renderTile} />);
    act(() => {
      mockContainerWidth = 640;
      mockResizeCallback();
    });

    expect(mockSwiperInstances).toHaveLength(1);
    expect(latestProps().freeMode.enabled).toBe(true);
    expect(latestProps().centeredSlides).toBe(true);
    expect(mockSwiperInstances[0].update).toHaveBeenCalled();
  });

  it.each([true, false])('ignores outgoing resize realignment when leaving desktop mode %s', (fromDesktop) => {
    mockDesktopViewport = fromDesktop;
    const { rerender } = render(<TileSlider items={items} renderTile={renderTile} />);
    const outgoingInstance = mockSwiperInstances[0];
    act(() => {
      outgoingInstance.activeIndex = 2;
      latestProps().onSlideChange(outgoingInstance);
    });
    const outgoingProps = latestProps();

    // Native resize runs before the media-query render and may realign a card.
    mockDesktopViewport = !fromDesktop;
    act(() => {
      outgoingInstance.activeIndex = 3;
      outgoingProps.onSlideChange(outgoingInstance);
    });
    rerender(<TileSlider items={items} renderTile={renderTile} />);

    expect(mockSwiperInstances).toHaveLength(2);
    expect(mockSwiperInstances[1].activeIndex).toBe(2);
  });

  it('restores selection after a new instance initializes against a stale container layout', () => {
    mockDesktopViewport = false;
    mockContainerWidth = 390;
    const { rerender } = render(<TileSlider items={items} renderTile={renderTile} />);
    act(() => {
      mockSwiperInstances[0].activeIndex = 2;
      latestProps().onSlideChange(mockSwiperInstances[0]);
    });

    // Viewport changes before ResizeObserver updates React's card layout.
    // Swiper measures the new 1152px container with the old centered settings
    // and temporarily normalizes initialSlide 2 into activeIndex 3.
    mockDesktopViewport = true;
    mockContainerWidth = 1152;
    mockInitialRealignedIndex = 3;
    rerender(<TileSlider items={items} renderTile={renderTile} />);
    const desktopInstance = mockSwiperInstances[1];
    expect(desktopInstance.activeIndex).toBe(3);
    expect(desktopInstance.slideTo).not.toHaveBeenCalled();

    act(() => mockResizeCallback());

    expect(desktopInstance.slideTo).toHaveBeenCalledWith(2, 0);
    expect(desktopInstance.activeIndex).toBe(2);
    expect(latestProps().centeredSlides).toBe(false);
  });

  it.each(['ctrlKey', 'metaKey'])('does not send %s zoom gestures to native Mousewheel', (modifier) => {
    render(<TileSlider items={items} renderTile={renderTile} />);
    const event = new WheelEvent('wheel', {
      deltaX: 20,
      [modifier]: true,
      bubbles: true,
      cancelable: true,
    });

    fireEvent(screen.getByTestId('swiper'), event);

    expect(mockWheelHandler).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('passes ordinary wheel input through to native Mousewheel', () => {
    render(<TileSlider items={items} renderTile={renderTile} />);
    fireEvent.wheel(screen.getByTestId('swiper'), { deltaX: 20 });

    expect(mockWheelHandler).toHaveBeenCalledTimes(1);
  });

  it('continues to use native next and previous commands for arrow taps', () => {
    render(<TileSlider items={items} renderTile={renderTile} />);
    fireEvent.click(screen.getByRole('button', { name: 'tile_slider_next' }));
    expect(mockSwiperInstances[0].slideNext).toHaveBeenCalledTimes(1);

    act(() => {
      mockSwiperInstances[0].activeIndex = 1;
      mockSwiperInstances[0].isBeginning = false;
      latestProps().onSlideChange(mockSwiperInstances[0]);
    });
    fireEvent.click(screen.getByRole('button', { name: 'tile_slider_previous' }));
    expect(mockSwiperInstances[0].slidePrev).toHaveBeenCalledTimes(1);
  });

  it('keeps the empty state free of slider instances and navigation', () => {
    render(<TileSlider items={[]} renderTile={renderTile} />);

    expect(mockSwiperInstances).toHaveLength(0);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
