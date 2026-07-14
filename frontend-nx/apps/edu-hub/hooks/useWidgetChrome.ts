import { useEffect } from 'react';

/**
 * Applies the shared "chrome" for embeddable widget pages:
 *  - tags <html>/<body> with the `widget-page` class so `styles/widget.css`
 *    can make the background transparent and remove page padding, and
 *  - hides any Cookiebot consent UI (which must not appear inside a widget
 *    embedded on a third-party site), including elements injected later.
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

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const hideCookiebot = () => {
      const selectors = [
        '#Cookiebot',
        '#CybotCookiebotDialog',
        '#CybotCookiebotDialogBody',
        '.Cookiebot',
        '.cookiebot',
        '[id*="cookiebot"]',
        '[class*="cookiebot"]',
        '[id*="Cookiebot"]',
        '[class*="Cookiebot"]',
      ];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const element = el as HTMLElement;
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.opacity = '0';
          element.style.height = '0';
          element.style.width = '0';
          element.style.overflow = 'hidden';
        });
      });
    };

    // Hide immediately and on interval to catch dynamically loaded elements.
    hideCookiebot();
    const interval = setInterval(hideCookiebot, 100);

    // Also react to DOM changes (Cookiebot injects its UI asynchronously).
    const observer = new MutationObserver(hideCookiebot);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);
};
