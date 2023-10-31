import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import Script from 'next/script';

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
            id="Cookiebot"
            src="https://consent.cookiebot.com/uc.js"
            data-cbid="718dfb5e-b62c-4993-9c65-99ae483f5510"
            data-blockingmode="auto"
            strategy="beforeInteractive"
            type="text/javaScript"
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
