import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Markdown to an HTML string on the server, with the same renderer and plugins
 * as the course page (`CourseContent/DescriptionFields.tsx`), so a feed shows
 * lists, links and tables the way the page does. Raw HTML in the source is not
 * passed through, as on the page.
 */
export const markdownToHtml = (markdown: string): string =>
  renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, markdown));
