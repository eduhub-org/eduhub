import { FC } from 'react';
import ReactMarkdown from 'react-markdown';

interface HeroHeadlineProps {
  /** Markdown: `**bold**` marks the emphasised words, each line break starts a new line. */
  markdown: string;
  className?: string;
}

/**
 * The homepage hero headline. The text is editable by admins in the app
 * settings, so only bold survives: any other Markdown (headings, links, lists)
 * is unwrapped to its plain text, and raw HTML is never rendered.
 */
const HeroHeadline: FC<HeroHeadlineProps> = ({ markdown, className = '' }) => {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <h1 className={`text-black uppercase leading-[0.9] tracking-[-0.01em] font-medium ${className}`}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          <ReactMarkdown
            allowedElements={['strong']}
            unwrapDisallowed
            components={{ strong: ({ children }) => <strong className="font-extrabold">{children}</strong> }}
          >
            {line}
          </ReactMarkdown>
        </span>
      ))}
    </h1>
  );
};

export default HeroHeadline;
