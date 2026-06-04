import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
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
      <div className="flex items-center">
        <label
          className={`flex flex-1 items-center ${
            disabled ? 'cursor-default' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            checked={localChecked}
            onChange={handleValueChange}
            disabled={disabled}
            className="mr-3 h-5 w-5 shrink-0 rounded border-border-primary bg-fill-primary text-brand focus:ring-brand focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {label ? (
            <span className="text-base font-medium text-label-primary">{label}</span>
          ) : null}
        </label>
        {helpText && (
          <Tooltip
            title={<span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{helpText}</span>}
            placement="top"
          >
            <IconButton
              size="small"
              aria-label={label ? `${label} help` : 'Field help'}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              sx={{ ml: 1, width: 44, height: 44, color: 'var(--eduhub-label-disabled)' }}
            >
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}

      {showSavedNotification && (
        <div className="absolute top-0 right-0 transform translate-x-full -translate-y-1/2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-1 rounded text-xs">Saved</div>
        </div>
      )}
    </div>
  );
};
