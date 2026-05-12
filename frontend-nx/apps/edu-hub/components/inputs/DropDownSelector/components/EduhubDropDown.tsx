import React from 'react';
import { Tooltip, SelectChangeEvent } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { Option } from '../types';
import { CreatableDropDown } from './CreatableDropDown';

type EduhubDropDownProps = {
  label?: string;
  placeholder?: string;
  localValue: string;
  localOptions: Option[];
  helpText?: string;
  errorMessage?: string;
  className?: string;
  creatable?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onValueChange: (event: SelectChangeEvent<string> | React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur: () => void;
  onCreateOption?: () => void;
  getLabelForValue?: (value?: string) => string;
  disabled?: boolean;
};

export const EduhubDropDown: React.FC<EduhubDropDownProps> = ({
  label,
  placeholder,
  localValue,
  localOptions,
  helpText,
  errorMessage,
  className = '',
  creatable,
  inputValue,
  onInputChange,
  onValueChange,
  onBlur,
  onCreateOption,
  getLabelForValue,
  disabled = false,
}) => {
  const baseClass = 'w-full h-12 pl-3 pr-10 py-3 text-label-primary rounded bg-fill-primary';
  const finalClassName = `${baseClass} ${className}`;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(event);
  };

  return (
    <div className="px-2">
      <div className={className || 'text-label-primary'}>
        {label && (
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              {helpText && (
                <Tooltip
                  title={<span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{helpText}</span>}
                  placement="top"
                >
                  <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
                </Tooltip>
              )}
              {label}
            </div>
          </div>
        )}
        <div className="light relative">
          {creatable && onInputChange && onCreateOption && getLabelForValue ? (
            <CreatableDropDown
              inputValue={inputValue || ''}
              localValue={localValue}
              variant="eduhub"
              className={finalClassName}
              placeholder={placeholder}
              label={label}
              localOptions={localOptions}
              errorMessage={errorMessage}
              onInputChange={onInputChange}
              onValueChange={onValueChange}
              onCreateOption={onCreateOption}
              getLabelForValue={getLabelForValue}
              disabled={disabled}
            />
          ) : (
            <select
              onChange={handleChange}
              onBlur={onBlur}
              value={localValue}
              disabled={disabled}
              className={`${finalClassName} ${errorMessage ? 'border-red-500' : ''}`}
            >
              {localOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {!label && helpText && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Tooltip
                title={<span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{helpText}</span>}
                placement="top"
              >
                <HelpOutline style={{ cursor: 'pointer', pointerEvents: 'auto' }} />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
