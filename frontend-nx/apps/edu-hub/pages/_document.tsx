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
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200..800&display=swap"
            rel="stylesheet"
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
