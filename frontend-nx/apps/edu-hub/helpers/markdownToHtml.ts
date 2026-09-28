import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Markdown to an HTML string on the server, with the same renderer and plugins
 * as the course page (`CourseContent/DescriptionFields.tsx`), so a feed shows
 * lists, links and tables the way the page does. Raw HTML in the source is not
 * passed through, as on the page.
 *
 * Relative link and image URLs are resolved against `origin`, since a feed
 * reader would otherwise resolve them against its own site. Unsafe schemes are
 * still dropped by react-markdown's default transform first.
 */
export const markdownToHtml = (markdown: string, origin: string): string => {
  const urlTransform = (url: string): string => {
    const safeUrl = defaultUrlTransform(url);
    if (!safeUrl) return safeUrl;
    try {
      return new URL(safeUrl, `${origin}/`).href;
    } catch {
      return safeUrl;
    }
  };
  return renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm], urlTransform }, markdown));
};
