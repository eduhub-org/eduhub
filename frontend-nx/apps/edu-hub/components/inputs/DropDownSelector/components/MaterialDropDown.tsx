import React from 'react';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { Option } from '../types';
import { CreatableDropDown } from './CreatableDropDown';

type MaterialDropDownProps = {
  label?: string;
  placeholder?: string;
  localValue: string;
  localOptions: Option[];
  helpText?: string;
  errorMessage?: string;
  hasBlurred?: boolean;
  creatable?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onValueChange: (event: SelectChangeEvent<string> | React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur: () => void;
  onCreateOption?: () => void;
  getLabelForValue?: (value?: string) => string;
};

export const MaterialDropDown: React.FC<MaterialDropDownProps> = ({
  label,
  placeholder,
  localValue,
  localOptions,
  helpText,
  errorMessage,
  hasBlurred,
  creatable,
  inputValue,
  onInputChange,
  onValueChange,
  onBlur,
  onCreateOption,
  getLabelForValue,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onValueChange(event);
  };

  return (
    <div className="col-span-10 flex mt-3">
      <FormControl variant="standard" className={hasBlurred && errorMessage ? 'w-3/4' : 'w-full'}>
        {label && (
          <InputLabel id={`${label}-label`}>
            {label}
          </InputLabel>
        )}
        {creatable && onInputChange && onCreateOption && getLabelForValue ? (
          <CreatableDropDown
            inputValue={inputValue || ''}
            localValue={localValue}
            variant="material"
            placeholder={placeholder}
            label={label}
            localOptions={localOptions}
            errorMessage={errorMessage}
            helpText={helpText}
            onInputChange={onInputChange}
            onValueChange={onValueChange}
            onCreateOption={onCreateOption}
            getLabelForValue={getLabelForValue}
          />
        ) : (
          <Select
            labelId={label ? `${label}-label` : undefined}
            value={localValue}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            displayEmpty
            sx={{
              minHeight: '32px',
              padding: '4px',
              ...(hasBlurred && errorMessage && {
                color: 'var(--eduhub-error)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--eduhub-error)',
                },
              }),
            }}
            MenuProps={{
              disablePortal: true, // Keep menu inside light context
              PaperProps: {
                sx: {
                  backgroundColor: 'var(--eduhub-fill-primary) !important',
                  color: 'var(--eduhub-label-primary) !important',
                  border: '1px solid var(--eduhub-border-primary)',
                  '& .MuiMenuItem-root': {
                    color: 'var(--eduhub-label-primary)',
                    '&:hover': {
                      backgroundColor: 'var(--eduhub-bg-secondary)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'var(--eduhub-bg-secondary)',
                      color: 'var(--eduhub-label-primary)',
                    },
                  },
                },
              },
            }}
            endAdornment={
              helpText && (
                <InputAdornment position="end">
                  <Tooltip title={helpText} placement="top">
                    <HelpOutline
                      style={{
                        cursor: 'pointer',
                        color: 'var(--eduhub-label-disabled)',
                        marginRight: '20px',
                      }}
                    />
                  </Tooltip>
                </InputAdornment>
              )
            }
          >
            {placeholder && (
              <MenuItem value="" disabled>
                {placeholder}
              </MenuItem>
            )}
            {localOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        )}
      </FormControl>
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
    </div>
  );
};
