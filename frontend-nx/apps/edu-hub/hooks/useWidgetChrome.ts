import { useEffect } from 'react';

/**
 * Applies the shared "chrome" for embeddable widget pages: tags <html>/<body>
 * with the `widget-page` class so `styles/widget.css` can make the background
 * transparent and remove page padding.
 *
 * Shared by every `pages/widget/*` route so the behaviour stays identical.
 */
export const useWidgetChrome = (): void => {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.classList.add('widget-page');
    document.documentElement.classList.add('widget-page');

    return () => {
      document.body.classList.remove('widget-page');
      document.documentElement.classList.remove('widget-page');
    };
  }, []);
};
