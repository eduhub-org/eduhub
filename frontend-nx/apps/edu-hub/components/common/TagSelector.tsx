import React, { useState } from 'react';
import MuiAutocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';

type TagSelectorProps = {
  label: string;
  placeholder: string;
  itemId: number;
  currentTags: { id: number, name: string }[];
  tagOptions: { id: number, name: string }[];
  insertTagMutation: DocumentNode;
  deleteTagMutation: DocumentNode;
  refetchQueries: string[];
  onTagAdded?: (data: any) => void;
  onTagRemoved?: (data: any) => void;
  type?: string;
  translationNamespace?: string;
};

const TagSelector: React.FC<TagSelectorProps> = ({
  label,
  placeholder,
  itemId,
  currentTags,
  tagOptions,
  insertTagMutation,
  deleteTagMutation,
  onTagAdded,
  onTagRemoved,
  refetchQueries,
  type = "default",
  translationNamespace
}) => {
  const [tags, setTags] = useState(currentTags);
  const [insertTag] = useAdminMutation(insertTagMutation, {
    onCompleted: (data) => {
      if (onTagAdded) onTagAdded(data);
    },
    refetchQueries
  });

  const [deleteTag] = useAdminMutation(deleteTagMutation, {
    onCompleted: (data) => {
      if (onTagRemoved) onTagRemoved(data);
    },
    refetchQueries
  });

  const handleTagChange = (event, value) => {
    const newTags = value;
    const oldTags = currentTags;

    for (const tag of newTags) {
      if (!oldTags.includes(tag)) {
        // New tag added
        insertTag({ variables: { itemId, tagId: tag.id } });
      }
    }

    for (const tag of oldTags) {
      if (!newTags.includes(tag)) {
        // Tag removed
        deleteTag({ variables: { itemId, tagId: tag.id } });
      }
    }

    setTags(newTags); // Update the default value after changes
  };

  const { t } = useTranslation();


  return (
    <div className="col-span-10 flex mt-3">
      <MuiAutocomplete
        className="w-3/4"
        multiple
        id="tags-standard"
        options={tagOptions}
        getOptionLabel={(option) =>
          translationNamespace
            ? t(`${translationNamespace}:${option.name}`)
            : option.name
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={label}
            placeholder={placeholder}
            InputLabelProps={{
              style: { color: 'rgb(34, 34, 34)' },
            }}
          />
        )}
        onChange={handleTagChange}
        defaultValue={tags}
        limitTags={2}
        getOptionSelected={(option, value) => option.id === value.id}
      />
    </div>
  );
};

export default TagSelector;
