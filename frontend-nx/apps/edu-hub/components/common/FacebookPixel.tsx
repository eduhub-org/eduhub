'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import * as fbq from '../../lib/fpixel';

const FacebookPixel = () => {
  const router = useRouter();

  const [isFBPixelLoaded, setFBPixelLoaded] = useState(false);

  useEffect(() => {
    if (isFBPixelLoaded && typeof window.fbq === 'function') {
      // This pageview only triggers the first time
      fbq.pageview();

      const handleRouteChange = () => {
        fbq.pageview();
      };

      router.events.on('routeChangeComplete', handleRouteChange);
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }
  }, [router.events, isFBPixelLoaded]);

  return (
    <>
      <noscript>
        <img
          height="1"
          width="1"
          alt="fb pixel id image"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=1775867059535400&ev=PageView&noscript=1`}
        />
      </noscript>
      <Script
        id="fb-pixel"
        data-cookieconsent="marketing"
        strategy="afterInteractive"
        type="text/plain"
        onLoad={() => setFBPixelLoaded(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1775867059535400');
            fbq('track', 'PageView');
          `,
        }}
      />
    </>
  );
};
export default FacebookPixel;
