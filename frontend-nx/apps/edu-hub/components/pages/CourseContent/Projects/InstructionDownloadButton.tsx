import { FC } from 'react';
import { useTranslations } from 'next-intl';
import { Tooltip } from '@mui/material';
import { MdOpenInNew } from 'react-icons/md';
import { safeProjectInstructionHref } from './projectMandatory';

interface InstructionDownloadButtonProps {
  /** Raw `ProjectDocumentationInstruction.url` of the selected instruction. */
  url?: string | null;
  disabled?: boolean;
  className?: string;
}

/**
 * Opens the currently selected documentation instruction in a new tab.
 * Resolves the stored `url` (a GCS object key or a seeded static PDF path) to a
 * safe href via `safeProjectInstructionHref`. Renders a disabled button when no
 * instruction is selected or the URL cannot be resolved safely.
 */
const InstructionDownloadButton: FC<InstructionDownloadButtonProps> = ({
  url,
  disabled = false,
  className = '',
}) => {
  const t = useTranslations('manageCourse');
  const href = safeProjectInstructionHref(url);
  const label = t('projects.add_dialog.instruction_open');
  const baseClass = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border-primary text-label-secondary ${className}`;

  if (disabled || !href) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled
        className={`${baseClass} cursor-not-allowed opacity-40`}
      >
        <MdOpenInNew />
      </button>
    );
  }

  return (
    <Tooltip title={label} placement="top">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={`${baseClass} hover:bg-bg-secondary`}
      >
        <MdOpenInNew />
      </a>
    </Tooltip>
  );
};

export default InstructionDownloadButton;
