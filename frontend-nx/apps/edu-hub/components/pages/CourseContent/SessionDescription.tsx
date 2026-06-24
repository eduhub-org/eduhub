import { FC, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { parseSimpleFormattedText } from '../../../helpers/parseSimpleFormattedText';

interface SessionDescriptionProps {
  description: string;
}

export const SessionDescription: FC<SessionDescriptionProps> = ({ description }) => {
  const t = useTranslations('course');
  const trimmed = description.trim();
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  const measureOverflow = useCallback(() => {
    const el = contentRef.current;
    if (!el || expanded) {
      return;
    }
    setCanExpand(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  useLayoutEffect(() => {
    measureOverflow();
  }, [trimmed, measureOverflow]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || expanded || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => measureOverflow());
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, measureOverflow]);

  if (!trimmed) {
    return null;
  }

  const showToggle = canExpand || expanded;

  return (
    <div className="mb-1">
      <p
        ref={contentRef}
        className={`text-sm text-label-secondary break-words whitespace-pre-wrap leading-snug ${
          expanded ? '' : 'line-clamp-2'
        }`}
      >
        {parseSimpleFormattedText(trimmed)}
      </p>
      {showToggle && (
        <button
          type="button"
          className="text-brand text-xs sm:text-sm font-medium hover:underline italic mt-0.5"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? t('sessions.description_show_less') : t('sessions.description_show_more')}
        </button>
      )}
    </div>
  );
};
