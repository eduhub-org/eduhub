import { FC, ReactNode, useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';

interface Props {
  title: string;
  summary: string;
  children: ReactNode;
}

/**
 * Collapses a large block behind a summary row on phones, so long editors do not stretch the page.
 * From md up it renders its children unchanged. Collapsing only hides the content, so autosaving
 * inputs inside keep their state.
 */
export const MobileCollapsible: FC<Props> = ({ title, summary, children }) => {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const [open, setOpen] = useState(false);

  if (!isPhone) {
    return <>{children}</>;
  }

  return (
    <div className="mx-2 mb-4 rounded-lg border border-border-primary bg-bg-card">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-label-primary"
      >
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          <span className="block truncate text-xs text-label-secondary">{summary}</span>
        </span>
        {open ? <IoIosArrowUp size={18} /> : <IoIosArrowDown size={18} />}
      </button>
      <div className={open ? 'pb-2' : 'hidden'}>{children}</div>
    </div>
  );
};

export default MobileCollapsible;
