import { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Markdown syntax that is left as typed instead of being parsed. Session
 * descriptions were plain text before, so a line starting with "-", "#" or
 * "1." must keep showing exactly that rather than turning into a list or
 * heading.
 */
const DISABLED_CONSTRUCTS = [
  'blockQuote',
  'codeFenced',
  'codeIndented',
  'codeText',
  'definition',
  'headingAtx',
  'htmlFlow',
  'htmlText',
  'labelStartImage',
  'list',
  'setextUnderline',
  'thematicBreak',
  // GFM
  'gfmFootnoteCall',
  'gfmFootnoteDefinition',
  'gfmPotentialFootnoteCall',
  'strikethrough',
  'table',
  'tasklistCheck',
];

function remarkInlineOnly(this: { data: () => object }) {
  const data = this.data() as { micromarkExtensions?: object[] };
  data.micromarkExtensions = [...(data.micromarkExtensions ?? []), { disable: { null: DISABLED_CONSTRUCTS } }];
}

const ALLOWED_ELEMENTS = ['p', 'br', 'a', 'em', 'strong'];

interface InlineMarkdownProps {
  /** Markdown in which only links, bold and italics are rendered. */
  markdown: string;
  className?: string;
}

/**
 * Renders a short user-written text with links (`[text](url)` or a bare URL),
 * `**bold**` and `*italics*`. Everything else stays plain text, line breaks
 * are kept, and raw HTML is never rendered.
 */
const InlineMarkdown: FC<InlineMarkdownProps> = ({ markdown, className = '' }) => (
  <div className={`break-words ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkInlineOnly]}
      allowedElements={ALLOWED_ELEMENTS}
      unwrapDisallowed
      components={{
        p: ({ children }) => <p className="whitespace-pre-line [&:not(:first-child)]:mt-2">{children}</p>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);

export default InlineMarkdown;
