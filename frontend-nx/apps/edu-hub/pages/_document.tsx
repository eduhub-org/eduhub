import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import Script from 'next/script';
import { FB_PIXEL_ID } from '../lib/fpixel';

class MyDocument extends Document {
  public static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  public render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@100;200;300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
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
            type="text/javaScript"
            strategy="beforeInteractive"
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
        </Head>
        <body className="font-body text-edu-black bg-edu-bg-gray">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
