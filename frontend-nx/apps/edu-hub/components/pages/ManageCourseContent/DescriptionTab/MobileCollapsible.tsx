import { FC, ReactNode, useState } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

interface Props {
  title: string;
  summary: string;
  children: ReactNode;
}

/**
 * Collapses a large block behind a summary row on phones, so long editors do not stretch the page.
 * From md up the frame and the summary row disappear and the content is always shown. The switch is
 * CSS only: the children stay mounted in the same tree, so resizing or collapsing never discards
 * what an input inside has not saved yet.
 */
export const MobileCollapsible: FC<Props> = ({ title, summary, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-2 mb-4 rounded-lg border border-border-primary bg-bg-card md:mx-0 md:mb-0 md:rounded-none md:border-0 md:bg-transparent">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-label-primary md:hidden"
      >
        <span className="min-w-0">
          <span className="block font-semibold">{title}</span>
          <span className="block truncate text-xs text-label-secondary">{summary}</span>
        </span>
        {open ? <IoIosArrowUp size={18} /> : <IoIosArrowDown size={18} />}
      </button>
      <div className={open ? 'pb-2 md:pb-0' : 'hidden md:block'}>{children}</div>
    </div>
  );
};

export default MobileCollapsible;
