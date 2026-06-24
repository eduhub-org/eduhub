import { Fragment, ReactNode } from 'react';

const MARKDOWN_LINK_PATTERN = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/;
const BARE_URL_PATTERN = /^(https?:\/\/[^\s<>)\]}"']+)/;
const BOLD_PATTERN = /^(\*\*|__)([\s\S]+?)\1/;
const ITALIC_PATTERN = /^(\*|_)([^*_]+?)\1/;

const isSafeHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

let nodeKey = 0;

const nextKey = (): string => `fmt-${nodeKey++}`;

const parseSegment = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const markdownLink = remaining.match(MARKDOWN_LINK_PATTERN);
    if (markdownLink && isSafeHttpUrl(markdownLink[2])) {
      nodes.push(
        <a
          key={nextKey()}
          href={markdownLink[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {markdownLink[1]}
        </a>
      );
      remaining = remaining.slice(markdownLink[0].length);
      continue;
    }

    const bareUrl = remaining.match(BARE_URL_PATTERN);
    if (bareUrl && isSafeHttpUrl(bareUrl[1])) {
      nodes.push(
        <a
          key={nextKey()}
          href={bareUrl[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all"
        >
          {bareUrl[1]}
        </a>
      );
      remaining = remaining.slice(bareUrl[0].length);
      continue;
    }

    const bold = remaining.match(BOLD_PATTERN);
    if (bold) {
      nodes.push(<strong key={nextKey()}>{parseSegment(bold[2])}</strong>);
      remaining = remaining.slice(bold[0].length);
      continue;
    }

    const italic = remaining.match(ITALIC_PATTERN);
    if (italic) {
      nodes.push(<em key={nextKey()}>{parseSegment(italic[2])}</em>);
      remaining = remaining.slice(italic[0].length);
      continue;
    }

    const markerIndex = remaining.search(/[*_[]/);
    const urlIndex = remaining.search(/https?:\/\//);
    const nextSpecial =
      markerIndex === -1
        ? urlIndex
        : urlIndex === -1
          ? markerIndex
          : Math.min(markerIndex, urlIndex);
    const plainEnd = nextSpecial === -1 ? remaining.length : nextSpecial;
    if (plainEnd > 0) {
      nodes.push(<Fragment key={nextKey()}>{remaining.slice(0, plainEnd)}</Fragment>);
      remaining = remaining.slice(plainEnd);
      continue;
    }

    nodes.push(<Fragment key={nextKey()}>{remaining[0]}</Fragment>);
    remaining = remaining.slice(1);
  }

  return nodes;
};

/** Renders limited inline formatting: **bold**, *italic*, [label](https://url), bare https:// links. */
export const parseSimpleFormattedText = (text: string): ReactNode[] => {
  nodeKey = 0;
  return parseSegment(text);
};
