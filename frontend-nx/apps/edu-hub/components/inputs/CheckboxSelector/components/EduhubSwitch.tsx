import React from 'react';
import { CheckboxSelectorProps } from '../types';

interface EduhubSwitchProps extends Omit<CheckboxSelectorProps, 'variant' | 'checked'> {
  localChecked: boolean;
  handleValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  errorMessage: string;
}

/**
 * On/off switch with the same behaviour as the eduhub checkbox. The track takes the surface's
 * primary text colour when on, so it stays neutral on light and dark surfaces alike.
 */
export const EduhubSwitch: React.FC<EduhubSwitchProps> = ({
  label,
  ariaLabel,
  localChecked,
  handleValueChange,
  disabled = false,
  className = '',
  errorMessage,
}) => (
  <div className={className}>
    <label
      className={`inline-flex min-h-[44px] items-center gap-2 touch-manipulation ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      {label ? <span className="text-sm font-semibold text-label-secondary">{label}</span> : null}
      <input
        type="checkbox"
        role="switch"
        checked={localChecked}
        onChange={handleValueChange}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-label-primary peer-focus-visible:ring-offset-2 ${
          localChecked ? 'bg-label-primary' : 'bg-border-primary'
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-fill-primary shadow transition-transform ${
            localChecked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </label>
    {errorMessage && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}
  </div>
);
