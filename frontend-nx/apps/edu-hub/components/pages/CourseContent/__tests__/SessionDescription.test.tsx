import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionDescription } from '../SessionDescription';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
});

describe('SessionDescription', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return (this as HTMLElement).dataset.mockScrollHeight
          ? Number((this as HTMLElement).dataset.mockScrollHeight)
          : 80;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return (this as HTMLElement).dataset.mockClientHeight
          ? Number((this as HTMLElement).dataset.mockClientHeight)
          : 40;
      },
    });
  });

  it('renders nothing when description is empty', () => {
    const { container } = render(<SessionDescription description="   " />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders formatted description text', () => {
    render(<SessionDescription description="Bring **laptop**." />);
    expect(screen.getByText('laptop').tagName).toBe('STRONG');
  });

  it('shows expand control when content overflows', () => {
    render(
      <SessionDescription description="Long description that should overflow the two line clamp." />
    );
    expect(screen.getByText('sessions.description_show_more')).toBeInTheDocument();
  });

  it('toggles between show more and show less', () => {
    render(<SessionDescription description="Long description that should overflow." />);
    fireEvent.click(screen.getByRole('button', { name: 'sessions.description_show_more' }));
    expect(screen.getByText('sessions.description_show_less')).toBeInTheDocument();
  });
});
