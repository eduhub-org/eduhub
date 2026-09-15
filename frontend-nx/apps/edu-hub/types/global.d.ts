
export {};

declare global {
  interface Window {
    fbq?: any;
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}
