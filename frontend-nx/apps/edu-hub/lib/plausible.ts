type PlausibleEventProps = Record<string, string | number | boolean>;

// window.plausible is undefined whenever the script isn't loaded - for
// admins/org admins (excluded in _app.tsx), before Cookiebot statistics
// consent is granted, or when a blocker strips the script - so every call
// site can fire events unconditionally without checking for its presence.
export const trackEvent = (eventName: string, props?: PlausibleEventProps): void => {
  if (typeof window === 'undefined' || typeof window.plausible !== 'function') {
    return;
  }
  window.plausible(eventName, props ? { props } : undefined);
};
