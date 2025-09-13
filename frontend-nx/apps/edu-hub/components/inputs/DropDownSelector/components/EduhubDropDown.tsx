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
  const t = useTranslations();
  const baseClass = 'w-full px-3 py-3 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = `${baseClass} ${className}`;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(event);
  };

  return (
    <div className="px-2">
      <div className={className || 'text-gray-400'}>
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            {helpText && (
              <Tooltip title={t(helpText)} placement="top">
                <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
              </Tooltip>
            )}
            {label}
          </div>
        </div>
        <div>
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
        </div>
      </div>
    </div>
  );
};
