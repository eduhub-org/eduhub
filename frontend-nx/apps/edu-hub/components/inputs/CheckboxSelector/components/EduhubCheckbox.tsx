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
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={localChecked}
          onChange={handleValueChange}
          disabled={disabled}
          className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {label && <span className="text-sm font-medium">{label}</span>}
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
