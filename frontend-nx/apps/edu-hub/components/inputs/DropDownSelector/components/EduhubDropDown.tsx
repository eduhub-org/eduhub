import React from 'react';
import { Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { Option } from '../types';
import { CreatableDropDown } from './CreatableDropDown';
import { SelectChangeEvent } from '@mui/material';

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
}) => {
  const baseClass = 'w-full pl-3 pr-10 py-3 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = `${baseClass} ${className}`;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(event);
  };

  return (
    <div className="px-2">
      <div className={className || 'text-gray-400'}>
        {label && (
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              {helpText && (
                <Tooltip title={helpText} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
                </Tooltip>
              )}
              {label}
            </div>
          </div>
        )}
        <div className="relative">
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
            />
          ) : (
            <select
              onChange={handleChange}
              onBlur={onBlur}
              value={localValue}
              className={`${finalClassName} ${errorMessage ? 'border-red-500' : ''}`}
            >
              {localOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {!label && helpText && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Tooltip title={helpText} placement="top">
                <HelpOutline style={{ cursor: 'pointer', pointerEvents: 'auto' }} />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
