import { FC, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';

interface Props {
  text: string;
  className?: string;
}

/**
 * Free text cut to four lines with a "read more" toggle. Short texts are shown in full and get no
 * toggle, so only long answers cost a click.
 */
export const ClampedText: FC<Props> = ({ text, className = '' }) => {
  const t = useTranslations('manageCourse.application_details');
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || expanded) return;
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <div>
      <div ref={ref} className={`whitespace-pre-wrap break-words ${expanded ? '' : 'line-clamp-4'} ${className}`}>
        {text}
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-1 inline-flex items-center gap-1 text-xs font-bold underline text-label-primary"
        >
          {t(expanded ? 'read_less' : 'read_more')}
          {expanded ? <MdKeyboardArrowUp size={16} /> : <MdKeyboardArrowDown size={16} />}
        </button>
      )}
    </div>
  );
};
