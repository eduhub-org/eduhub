import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline } from '@mui/icons-material';
import { CheckboxSelectorProps } from '../types';

interface MaterialCheckboxProps extends Omit<CheckboxSelectorProps, 'variant' | 'checked'> {
  localChecked: boolean;
  handleValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showSavedNotification: boolean;
  errorMessage: string;
}

export const MaterialCheckbox: React.FC<MaterialCheckboxProps> = ({
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
          className="mr-3 w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {label && (
          <span className="text-base font-medium flex items-center gap-1">
            {label}
            {helpText && (
              <Tooltip title={helpText} placement="top">
                <HelpOutline
                  fontSize="small"
                  style={{ cursor: 'pointer', color: 'var(--eduhub-label-disabled)' }}
                />
              </Tooltip>
            )}
          </span>
        )}
      </label>

      {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}

      {showSavedNotification && (
        <div className="absolute top-0 right-0 transform translate-x-full -translate-y-1/2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-1 rounded text-xs">Saved</div>
        </div>
      )}
    </div>
  );
};
