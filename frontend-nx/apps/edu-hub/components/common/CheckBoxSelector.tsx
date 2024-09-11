import React, { useState } from 'react';
import { FormControl, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import useTranslation from 'next-translate/useTranslation';

type CheckboxSelectorProps = {
  label?: string;
  options: { id: number, name: string }[];
  currentOptions: { id: number, name: string }[];
  onOptionsChange?: (selectedOptions: { id: number, name: string }[]) => void;
  className?: string;
  translationNamespace?: string;
};

const CheckboxSelector: React.FC<CheckboxSelectorProps> = ({
  label,
  options,
  currentOptions,
  onOptionsChange,
  className,
  translationNamespace
}) => {
  const { t } = useTranslation();
  const [selectedOptions, setSelectedOptions] = useState(currentOptions);

  const handleOptionChange = (event, checked) => {
    const optionId = parseInt(event.target.value, 10);

    if (checked) {
      const addedOption = options.find((option) => option.id === optionId);
      const newSelectedOptions = [...selectedOptions, addedOption];
      setSelectedOptions(newSelectedOptions);
      if (onOptionsChange) {
        onOptionsChange(newSelectedOptions);
      }
    } else {
      const newSelectedOptions = selectedOptions.filter((option) => option.id !== optionId);
      setSelectedOptions(newSelectedOptions);
      if (onOptionsChange) {
        onOptionsChange(newSelectedOptions);
      }
    }
  };

  return (
    <div className={className}>
      <FormControl component="fieldset" className="w-full">
        <legend>{label}</legend>
        <FormGroup>
          {options.map((option) => (
            <FormControlLabel
              key={option.id}
              control={
                <Checkbox
                  checked={selectedOptions.some((selectedOption) => selectedOption.id === option.id)}
                  onChange={handleOptionChange}
                  value={option.id}
                />
              }
              label={
                translationNamespace
                  ? t(`${translationNamespace}:${option.name}`)
                  : option.name
              }
            />
          ))}
        </FormGroup>
      </FormControl>
    </div>
  );
};

export default CheckboxSelector;
