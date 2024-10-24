'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import * as fbq from '../../lib/fpixel';

const FacebookPixel = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isFBPixelLoaded, setFBPixelLoaded] = useState(false);

  useEffect(() => {
    if (isFBPixelLoaded && typeof window.fbq === 'function') {
      // This pageview triggers on initial load and subsequent route changes
      fbq.pageview();
    }
  }, [pathname, searchParams, isFBPixelLoaded]);

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
