import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@material-ui/core/Tooltip';
import InputAdornment from '@material-ui/core/InputAdornment';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { useTheme } from '@material-ui/core/styles';

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
  isMandatory=false,
  style
}) => {
  const [text, setText] = useState(currentText);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [updateText] = useAdminMutation(updateTextMutation, {
    onCompleted: (data) => {
      if (onTextUpdated) onTextUpdated(data);
    },
    refetchQueries
  });

  const handleTextChange = (event) => {
    const newText = event.target.value;
    updateText({ variables: { itemId, text: newText } });
    setText(newText);
    setHasBlurred(false); // Reset the blurred state when text changes
    setErrorMessage(''); // Clear any existing error message
  };

  const handleBlur = () => {
    setHasBlurred(true);
    if (isTypeCheckFailed) {
      setErrorMessage(t(errorText)); // Replace with your actual error message
    }
  };

  const { t } = useTranslation(translationNamespace);

  const isTypeCheckFailed = typeCheck ? 
    !(typeCheck(text) || (!isMandatory && text === '')) : 
    (isMandatory && text === '');

  const theme = useTheme();
  const placeholderColor = theme.palette.text.disabled;

  return (
    <div className="col-span-10 flex mt-3">
      <TextField
        className={hasBlurred && errorMessage ? "w-3/4" : "w-full"}
        variant="standard"
        label={t(label)}
        placeholder={t(placeholder)}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        InputLabelProps={{
          style: { color: isTypeCheckFailed ? 'red' : 'rgb(34, 34, 34)' }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={t(helpText)} placement="top">
                <HelpOutlineIcon style={{ cursor: "pointer", color: placeholderColor }} />
              </Tooltip>
            </InputAdornment>
          ),
          style: { color: isTypeCheckFailed ? 'red' : 'inherit' }
        }}
      />
      {hasBlurred && errorMessage && (
        <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>
      )}

    </div>
  );
};

export default TextFieldEditor;
