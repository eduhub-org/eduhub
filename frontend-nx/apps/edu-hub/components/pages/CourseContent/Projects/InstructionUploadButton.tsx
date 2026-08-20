import { FC } from 'react';
import { Tooltip } from '@mui/material';
import { MdUploadFile } from 'react-icons/md';

interface InstructionUploadButtonProps {
  onClick: () => void;
  disabled?: boolean;
  /**
   * Accessible name and tooltip. Callers pass the reason when `disabled` is set
   * (e.g. no project type selected yet), so the button explains itself.
   */
  label: string;
  className?: string;
}

/**
 * Opens the dialog for managing the instructor's own documentation instructions.
 * Sits next to `InstructionDownloadButton` and deliberately copies its shape so
 * the pair reads as one control group.
 */
const InstructionUploadButton: FC<InstructionUploadButtonProps> = ({
  onClick,
  disabled = false,
  label,
  className = '',
}) => {
  const baseClass = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-border-primary text-label-secondary touch-manipulation ${className}`;

  if (disabled) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled
        className={`${baseClass} cursor-not-allowed opacity-40`}
      >
        <MdUploadFile />
      </button>
    );
  }

  return (
    <Tooltip title={label} placement="top">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`${baseClass} hover:bg-bg-secondary`}
      >
        <MdUploadFile />
      </button>
    </Tooltip>
  );
};

export default InstructionUploadButton;
