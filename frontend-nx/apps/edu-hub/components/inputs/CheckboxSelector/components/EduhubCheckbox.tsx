import React from 'react';
import { CheckboxSelectorProps } from '../types';

interface EduhubCheckboxProps extends Omit<CheckboxSelectorProps, 'variant' | 'checked'> {
  localChecked: boolean;
  handleValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showSavedNotification: boolean;
  errorMessage: string;
}

export const EduhubCheckbox: React.FC<EduhubCheckboxProps> = ({
  label,
  localChecked,
  handleValueChange,
  helpText,
  disabled = false,
  className = '',
  showSavedNotification,
  errorMessage,
}) => {
  return (
    <div className={`relative ${className}`}>
      <label
        className={`flex items-center ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <input
          type="checkbox"
          checked={localChecked}
          onChange={handleValueChange}
          disabled={disabled}
          className="mr-3 h-4 w-4 shrink-0 rounded border-border-primary bg-fill-primary text-brand focus:ring-brand focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {label ? (
          <span className="text-sm font-medium text-label-primary">{label}</span>
        ) : null}
      </label>

      {helpText && <p className="mt-1 text-xs text-gray-600">{helpText}</p>}

      {errorMessage && <p className="mt-1 text-xs text-red-600">{errorMessage}</p>}

      {showSavedNotification && (
        <div className="absolute top-0 right-0 transform translate-x-full -translate-y-1/2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-2 py-1 rounded text-xs">✓</div>
        </div>
      )}
    </div>
  );
};
