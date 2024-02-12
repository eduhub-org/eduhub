import React, { useState } from 'react';
import { DocumentNode } from 'graphql';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import InputAdornment from '@material-ui/core/InputAdornment';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { useTheme } from '@material-ui/core/styles';
import { useDebouncedCallback } from 'use-debounce';
import { useAdminMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';

type TextFieldEditorProps = {
  label: string;
  placeholder: string;
  itemId: number;
  currentText: string;
  updateTextMutation: DocumentNode;
  onTextUpdated?: (data: any) => void;
  refetchQueries: string[];
  typeCheck?: (text: string) => boolean;
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  isMandatory?: boolean;
  style?: string;
};

const TextFieldEditor: React.FC<TextFieldEditorProps> = ({
  label,
  placeholder,
  itemId,
  currentText,
  updateTextMutation,
  onTextUpdated,
  refetchQueries,
  typeCheck,
  helpText,
  errorText,
  translationNamespace,
  isMandatory = false,
  style,
}) => {
  const { t } = useTranslation(translationNamespace);

  const [text, setText] = useState(currentText);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [updateText] = useAdminMutation(updateTextMutation, {
    onCompleted: (data) => {
      if (onTextUpdated) onTextUpdated(data);
    },
    refetchQueries,
  });

  const validateText = (newText) => {
    if (typeCheck) {
      return typeCheck(newText) || (!isMandatory && newText === '');
    }
    return isMandatory ? newText !== '' : true;
  };

  const debouncedUpdateText = useDebouncedCallback((newText) => {
    if (validateText(newText)) {
      updateText({ variables: { itemId, text: newText } });
      setErrorMessage(''); // Clear any existing error message
    } else {
      setErrorMessage(t(errorText || 'Invalid input')); // Use your error message
    }
    setHasBlurred(false); // Reset the blurred state when text changes
  }, 1000);

  const handleTextChange = (event) => {
    const newText = event.target.value;
    setText(newText); // Update text state immediately for UI feedback
    debouncedUpdateText(newText); // Call debounced function with the new text
  };

  const handleBlur = () => {
    setHasBlurred(true);
    setErrorMessage(validateText(text) ? '' : t(errorText || 'Invalid input'));
  };

  const theme = useTheme();
  const placeholderColor = theme.palette.text.disabled;

  return (
    <div className="col-span-10 flex mt-3">
      <TextField
        className={hasBlurred && errorMessage ? 'w-3/4' : 'w-full'}
        variant="standard"
        label={t(label)}
        placeholder={t(placeholder)}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        InputLabelProps={{
          style: { color: hasBlurred && errorMessage ? 'red' : 'rgb(34, 34, 34)' },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={t(helpText || '')} placement="top">
                <HelpOutlineIcon style={{ cursor: 'pointer', color: placeholderColor }} />
              </Tooltip>
            </InputAdornment>
          ),
          style: { color: hasBlurred && errorMessage ? 'red' : 'inherit' },
        }}
      />
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
    </div>
  );
};

export default TextFieldEditor;
