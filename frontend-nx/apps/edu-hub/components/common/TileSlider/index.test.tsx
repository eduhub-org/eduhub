import React, { StrictMode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import TileSlider from '.';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('TileSlider', () => {
  it('ignores captured load handlers after every Swiper instance is destroyed', async () => {
    const loadHandlers: EventListener[] = [];
    const addEventListener = HTMLElement.prototype.addEventListener;
    const addEventListenerSpy = jest
      .spyOn(HTMLElement.prototype, 'addEventListener')
      .mockImplementation(function (this: HTMLElement, type, listener, options) {
        if (type === 'load' && typeof listener === 'function' && this.classList.contains('swiper')) {
          loadHandlers.push(listener);
        }

        addEventListener.call(this, type, listener, options);
      });

    try {
      const { unmount } = render(
        <StrictMode>
          <TileSlider items={[{ id: 1 }]} renderTile={(item) => <div>Tile {item.id}</div>} />
        </StrictMode>
      );

      await waitFor(() => expect(loadHandlers.length).toBeGreaterThan(0));

      unmount();

      const event = new Event('load');
      expect(() => {
        act(() => {
          loadHandlers.forEach((handler) => handler(event));
        });
      }).not.toThrow();
    } finally {
      addEventListenerSpy.mockRestore();
    }
  });
});
