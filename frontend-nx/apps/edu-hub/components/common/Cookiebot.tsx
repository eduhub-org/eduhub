'use client';

import Script from 'next/script';

const Cookiebot = () => {
  return (
    <>
      <Script
        id="Cookiebot"
        src="https://consent.cookiebot.com/uc.js"
        data-cbid="718dfb5e-b62c-4993-9c65-99ae483f5510"
        data-blockingmode="auto"
        strategy="beforeInteractive"
        type="text/javaScript"
      />
    </>
  );
};
export default Cookiebot;
