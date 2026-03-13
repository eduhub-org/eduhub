import React, { useState, useCallback } from 'react';
import { Add as AddIcon, HelpOutline } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useTranslations } from 'next-intl';
import { Option } from '../types';
import { SelectChangeEvent } from '@mui/material';

type CreatableDropDownProps = {
  inputValue: string;
  localValue: string;
  variant: 'material' | 'eduhub';
  className?: string;
  placeholder?: string;
  label?: string;
  localOptions: Option[];
  errorMessage?: string;
  helpText?: string;
  onInputChange: (value: string) => void;
  onValueChange: (event: SelectChangeEvent<string> | React.ChangeEvent<HTMLSelectElement>) => void;
  onCreateOption: () => void;
  getLabelForValue: (value?: string) => string;
  disabled?: boolean;
};

export const CreatableDropDown: React.FC<CreatableDropDownProps> = ({
  inputValue,
  localValue,
  variant,
  className,
  placeholder,
  label,
  localOptions,
  errorMessage,
  helpText,
  onInputChange,
  onValueChange,
  onCreateOption,
  getLabelForValue,
  disabled = false,
}) => {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isCleared, setIsCleared] = useState(false);

  const getFilteredOptions = useCallback(
    (searchValue = '') => {
      return localOptions.filter((option) => {
        const labelMatch = option.label.toLowerCase().includes(searchValue.toLowerCase());
        const aliasMatch = option.aliases?.some((alias) => {
          if (!alias) return false;
          if (typeof alias === 'object' && 'name' in alias) {
            return alias.name.toLowerCase().includes(searchValue.toLowerCase());
          }
          if (typeof alias === 'string') {
            return alias.toLowerCase().includes(searchValue.toLowerCase());
          }
          return false;
        });
        return labelMatch || aliasMatch;
      });
    },
    [localOptions]
  );

  const shouldShowCreateOption = useCallback(
    (searchValue = '') => {
      if (!searchValue) return false;

      const searchLower = searchValue.toLowerCase();
      const filteredOptions = getFilteredOptions(searchValue);

      // Don't show create option if there's an exact name match
      const hasExactNameMatch = filteredOptions.some((option) => option.label.toLowerCase() === searchLower);

      // Don't show create option if there's an exact alias match
      const hasExactAliasMatch = filteredOptions.some((option) => {
        if (!option.aliases) return false;
        return option.aliases.some((alias) => {
          if (!alias) return false;
          let aliasName = '';
          if (typeof alias === 'string') {
            aliasName = alias;
          } else if (typeof alias === 'object' && 'name' in alias) {
            aliasName = alias.name;
          }
          return aliasName.toLowerCase() === searchLower;
        });
      });

      return !hasExactNameMatch && !hasExactAliasMatch;
    },
    [getFilteredOptions]
  );

  const handleValueChange = (value: string | null) => {
    const syntheticEvent = {
      target: { value: value === null ? null : value },
    } as SelectChangeEvent<string>;
    onValueChange(syntheticEvent);
  };

  const handleOptionSelect = (optionValue: string) => {
    handleValueChange(optionValue);
    // Force the display of the selected value
    const selectedLabel = getLabelForValue(optionValue);
    onInputChange(selectedLabel);
    setIsOpen(false);
    setIsCleared(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const filteredOptions = getFilteredOptions(inputValue);
    const totalItems = shouldShowCreateOption(inputValue) ? filteredOptions.length + 1 : filteredOptions.length;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const optionElements = document.querySelectorAll('.dropdown-option');
      optionElements.forEach((el) => el.classList.remove('hover:bg-gray-300'));

      setHighlightedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const optionElements = document.querySelectorAll('.dropdown-option');
      optionElements.forEach((el) => el.classList.remove('hover:bg-gray-300'));

      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        const selectedOption = filteredOptions[highlightedIndex];
        handleOptionSelect(selectedOption.value);
      } else if (highlightedIndex === filteredOptions.length && shouldShowCreateOption(inputValue)) {
        onCreateOption();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <input
          type="text"
          disabled={disabled}
          value={isCleared ? '' : inputValue || (localValue ? getLabelForValue(localValue) : '')}
          onChange={(e) => {
            if (disabled) return;
            onInputChange(e.target.value);
            if (!e.target.value) {
              handleValueChange(null);
              setIsCleared(true);
            } else {
              setIsCleared(false);
            }
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (disabled) return;
            setIsOpen(true);
            if (!inputValue && !isCleared) {
              onInputChange(getLabelForValue(localValue));
            }
          }}
          onBlur={() => {
            if (variant === 'eduhub') {
              setTimeout(() => setIsOpen(false), 200);
            }
          }}
          className={
            variant === 'eduhub'
              ? `${className} ${errorMessage ? 'border-red-500' : ''}`
              : 'w-full p-2 border rounded'
          }
          placeholder={placeholder || label}
        />
        {helpText && (
          <Tooltip title={helpText} placement="top">
            <HelpOutline
              style={{
                cursor: 'pointer',
                color: 'var(--eduhub-label-secondary)',
                marginLeft: '8px',
                fontSize: '20px',
              }}
            />
          </Tooltip>
        )}
      </div>
      {!disabled && isOpen && (
        <div
          className={`absolute w-full bg-fill-primary text-label-primary border border-border-primary rounded-md shadow-lg max-h-60 overflow-auto light ${
            variant === 'eduhub' ? 'z-50' : 'z-10'
          }`}
        >
          {getFilteredOptions(inputValue).map((option, index) => (
            <div
              key={option.value}
              className={`dropdown-option px-4 py-2 cursor-pointer ${
                highlightedIndex === index ? 'bg-[var(--eduhub-border-primary)]' : 'hover:bg-[var(--eduhub-border-primary)]'
              }`}
              onClick={() => handleOptionSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseLeave={() => setHighlightedIndex(-1)}
            >
              {option.label}
            </div>
          ))}
          {shouldShowCreateOption(inputValue) && (
            <div
              className={`px-4 py-2 cursor-pointer text-brand flex items-center ${
                highlightedIndex === getFilteredOptions(inputValue).length ? 'bg-[var(--eduhub-border-primary)]' : 'hover:bg-[var(--eduhub-border-primary)]'
              }`}
              onClick={onCreateOption}
            >
              <AddIcon className="w-4 h-4 mr-2" />
              {t('dropdown_selector.create_option', { option: inputValue })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
