import React, { useState } from 'react';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';
import { gql } from '@apollo/client';
import { Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';
import { styled } from '@mui/material/styles';

type RadioButtonSelectorProps = {
  immediateCommit?: boolean;
  label: string;
  itemId: number;
  currentValue: string;
  radioOptions: { value: string; label: string }[];
  setRadioMutation?: DocumentNode;
  onSelectedValueChange?: (newValue: string) => void;
  refetchQueries: string[];
  className?: string;
  translationNamespace?: string;
};

// Create a styled Radio component
const GrayRadio = styled(Radio)(() => ({
  color: '#4A5568', // Tailwind's gray-400
  '&.Mui-checked': {
    color: '#4A5568',
  },
}));

const RadioButtonSelector: React.FC<RadioButtonSelectorProps> = ({
  immediateCommit = true,
  label,
  itemId,
  currentValue,
  radioOptions,
  setRadioMutation,
  onSelectedValueChange,
  refetchQueries,
  className,
  translationNamespace,
}) => {
  const [value, setValue] = useState(currentValue);
  const { t } = useTranslation();

  const DUMMY_MUTATION = gql`
    mutation DummyMutation {
      __typename
    }
  `;

  const [setRadio] = useAdminMutation(setRadioMutation || DUMMY_MUTATION, {
    refetchQueries,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);

    if (immediateCommit) {
      setRadio({ variables: { itemId, value: newValue } });
    }
    if (onSelectedValueChange) {
      onSelectedValueChange(newValue);
    }
  };

  return (
    <div className={className}>
      <FormControl component="fieldset">
        <RadioGroup aria-label={label} name={label} value={value} onChange={handleChange}>
          {radioOptions.map((option, index) => (
            <FormControlLabel
              key={index}
              value={option.value}
              control={<GrayRadio />}
              label={translationNamespace ? t(`${translationNamespace}:${option.label}`) : option.label}
            />
          ))}
        </RadioGroup>
      </FormControl>
    </div>
  );
};

export default RadioButtonSelector;
