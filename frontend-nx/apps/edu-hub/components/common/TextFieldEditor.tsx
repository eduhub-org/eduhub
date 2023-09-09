import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';

type TextFieldEditorProps = {
  label: string;
  placeholder: string;
  itemId: number;
  currentText: string;
  updateTextMutation: DocumentNode;
  onTextUpdated?: (data: any) => void;
  refetchQueries: string[];
  type?: string;
  translationNamespace?: string;
};

const TextFieldEditor: React.FC<TextFieldEditorProps> = ({
  label,
  placeholder,
  itemId,
  currentText,
  updateTextMutation,
  onTextUpdated,
  refetchQueries,
  type = "default",
  translationNamespace
}) => {
  const [text, setText] = useState(currentText);
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
  };

  const { t } = useTranslation();

  return (
    <div className="col-span-10 flex mt-3">
      <TextField
        className="w-3/4"
        variant="standard"
        label={label}
        placeholder={placeholder}
        value={text}
        onChange={handleTextChange}
        InputLabelProps={{
          style: { color: 'rgb(34, 34, 34)' },
        }}
      />
    </div>
  );
};

export default TextFieldEditor;
