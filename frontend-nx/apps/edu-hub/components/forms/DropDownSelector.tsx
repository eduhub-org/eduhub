import React, { useState } from 'react';
import { DocumentNode } from 'graphql';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useDebouncedCallback } from 'use-debounce';
import { useAdminMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

type DropDownSelectorProps = {
  label?: string; // Made optional
  itemId: string | number;
  currentValue: string;
  options: string[];
  updateValueMutation: DocumentNode;
  onValueUpdated?: (data: any) => void;
  refetchQueries: string[];
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  translationPrefix?: string;
  isMandatory?: boolean;
};

const DropDownSelector: React.FC<DropDownSelectorProps> = ({
  label,
  itemId,
  currentValue,
  options,
  updateValueMutation,
  onValueUpdated,
  refetchQueries,
  helpText,
  errorText,
  translationNamespace,
  translationPrefix = '',
  isMandatory = false,
}) => {
  const { t } = useTranslation(translationNamespace);

  const [value, setValue] = useState(currentValue);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [updateValue] = useAdminMutation(updateValueMutation, {
    onCompleted: (data) => {
      if (onValueUpdated) onValueUpdated(data);
    },
    refetchQueries,
  });

  const validateValue = (newValue: string) => {
    return isMandatory ? newValue !== '' : true;
  };

  const debouncedUpdateValue = useDebouncedCallback((newValue: string) => {
    if (validateValue(newValue)) {
      updateValue({ variables: { id: itemId, value: newValue } });
      setErrorMessage('');
    } else {
      setErrorMessage(t(errorText || 'Invalid selection'));
    }
    setHasBlurred(false);
  }, 300);

  const handleValueChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;
    setValue(newValue);
    debouncedUpdateValue(newValue);
  };

  const handleBlur = () => {
    setHasBlurred(true);
    setErrorMessage(validateValue(value) ? '' : t(errorText || 'Invalid selection'));
  };

  const theme = useTheme();
  const placeholderColor = theme.palette.text.disabled;

  return (
    <div className="col-span-10 flex mt-3">
      <FormControl variant="standard" className={hasBlurred && errorMessage ? 'w-3/4' : 'w-full'}>
        {label && (
          <InputLabel id={`${label}-label`} style={{ color: hasBlurred && errorMessage ? 'red' : 'rgb(34, 34, 34)' }}>
            {t(label)}
          </InputLabel>
        )}
        <Select
          labelId={label ? `${label}-label` : undefined}
          value={value}
          onChange={handleValueChange}
          onBlur={handleBlur}
          style={{ color: hasBlurred && errorMessage ? 'red' : 'inherit' }}
          endAdornment={
            helpText ? (
              <InputAdornment position="end">
                <Tooltip title={t(helpText)} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', color: placeholderColor }} />
                </Tooltip>
              </InputAdornment>
            ) : null
          }
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {t(`${translationPrefix}${option}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
    </div>
  );
};

export default DropDownSelector;
