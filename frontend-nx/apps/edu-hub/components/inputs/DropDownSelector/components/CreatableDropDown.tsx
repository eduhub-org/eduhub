import React, { useState, useCallback, useRef } from 'react';
import { Add as AddIcon, HelpOutline } from '@mui/icons-material';
import { Popper, Tooltip } from '@mui/material';
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
  onCreateOption?: () => void;
  getLabelForValue: (value?: string) => string;
  allowCreate?: boolean;
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
  allowCreate = true,
  disabled = false,
}) => {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isCleared, setIsCleared] = useState(false);
  // The list is only narrowed once the user types. On focus the field is pre-filled with the label
  // of the current selection, which would otherwise filter the list down to that one option.
  const [isSearching, setIsSearching] = useState(false);
  const searchValue = isSearching ? inputValue : '';
  const anchorRef = useRef<HTMLDivElement>(null);

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
      if (!allowCreate || !searchValue) return false;

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
    [allowCreate, getFilteredOptions]
  );

  const handleValueChange = (value: string) => {
    const syntheticEvent = {
      target: { value },
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
    setIsSearching(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const filteredOptions = getFilteredOptions(searchValue);
    const totalItems = shouldShowCreateOption(searchValue) ? filteredOptions.length + 1 : filteredOptions.length;

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
      } else if (
        highlightedIndex === filteredOptions.length &&
        shouldShowCreateOption(searchValue) &&
        onCreateOption
      ) {
        onCreateOption();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div ref={anchorRef} className="flex items-center">
        <input
          type="text"
          disabled={disabled}
          value={isCleared ? '' : inputValue || (localValue ? getLabelForValue(localValue) : '')}
          onChange={(e) => {
            if (disabled) return;
            onInputChange(e.target.value);
            if (!e.target.value) {
              handleValueChange('');
              setIsCleared(true);
            } else {
              setIsCleared(false);
            }
            setIsSearching(true);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (disabled) return;
            setIsOpen(true);
            setIsSearching(false);
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
          <Tooltip
            title={<span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{helpText}</span>}
            placement="top"
          >
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
      {/* Fixed positioning lets the list escape ancestors that clip their overflow, such as
          TableGrid cells; disablePortal keeps it inside dialogs and the surrounding theme. */}
      <Popper
        open={!disabled && isOpen && !!anchorRef.current}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        disablePortal
        popperOptions={{ strategy: 'fixed' }}
        style={{ minWidth: anchorRef.current?.offsetWidth, maxWidth: '24rem', zIndex: 1300 }}
      >
        <div
          className="w-full bg-fill-primary text-label-primary border border-border-primary rounded-md shadow-lg max-h-60 overflow-auto light"
        >
          {getFilteredOptions(searchValue).map((option, index) => (
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
          {shouldShowCreateOption(searchValue) && onCreateOption && (
            <div
              className={`px-4 py-2 cursor-pointer text-brand flex items-center ${
                highlightedIndex === getFilteredOptions(searchValue).length ? 'bg-[var(--eduhub-border-primary)]' : 'hover:bg-[var(--eduhub-border-primary)]'
              }`}
              onClick={onCreateOption}
            >
              <AddIcon className="w-4 h-4 mr-2" />
              {t('dropdown_selector.create_option', { option: inputValue })}
            </div>
          )}
        </div>
      </Popper>
    </div>
  );
};
