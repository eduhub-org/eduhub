import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from 'next/document';
import { DocumentHeadTags, documentGetInitialProps } from '@mui/material-nextjs/v15-pagesRouter';
import type { DocumentHeadTagsProps } from '@mui/material-nextjs/v15-pagesRouter';

// Extend the props for MyDocument to include DocumentHeadTagsProps
type MyDocumentProps = DocumentInitialProps & DocumentHeadTagsProps;

class MyDocument extends Document<MyDocumentProps> {
  public static async getInitialProps(ctx: DocumentContext): Promise<MyDocumentProps> {
    // Fetch initial props including DocumentHeadTagsProps
    const initialProps = await documentGetInitialProps(ctx);

    // Return the initial props with the proper typing
    return initialProps as MyDocumentProps;
  }

  public render() {
    return (
      <Html>
        <Head>
          {/* Self-hosted Plus Jakarta Sans (@font-face in styles/globals.css); preload the
              Latin subset every page uses so text doesn't flash in the fallback font. */}
          <link
            rel="preload"
            href="/fonts/plus-jakarta-sans/plus-jakarta-sans-latin-wght-normal.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          {/* Pass the combined props to DocumentHeadTags */}
          <DocumentHeadTags {...this.props} />
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
