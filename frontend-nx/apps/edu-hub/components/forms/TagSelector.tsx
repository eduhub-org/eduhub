import React, { useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';
import { gql } from '@apollo/client';

type TagSelectorProps = {
  immediateCommit?: boolean;
  label: string;
  placeholder: string;
  itemId: number;
  currentTags: { id: number; name: string }[];
  tagOptions: { id: number; name: string }[];
  insertTagMutation?: DocumentNode;
  deleteTagMutation?: DocumentNode;
  onSelectedTagsChange?: (selectedTags: { id: number; name: string }[]) => void;
  onTagAdded?: (data: any) => void;
  onTagRemoved?: (data: any) => void;
  refetchQueries: string[];
  className?: string;
  translationNamespace?: string;
};

const TagSelector: React.FC<TagSelectorProps> = ({
  immediateCommit = true,
  label,
  placeholder,
  itemId,
  currentTags,
  tagOptions,
  insertTagMutation,
  deleteTagMutation,
  onSelectedTagsChange,
  onTagAdded,
  onTagRemoved,
  refetchQueries,
  className,
  translationNamespace,
}) => {
  const [tags, setTags] = useState(currentTags);
  const { t } = useTranslation();

  const DUMMY_MUTATION = gql`
    mutation DummyMutation {
      __typename
    }
  `;

  const [insertTag] = useAdminMutation(insertTagMutation || DUMMY_MUTATION, {
    onCompleted: (data) => {
      if (onTagAdded) onTagAdded(data);
    },
    refetchQueries,
  });

  const [deleteTag] = useAdminMutation(deleteTagMutation || DUMMY_MUTATION, {
    onCompleted: (data) => {
      if (onTagRemoved) onTagRemoved(data);
    },
    refetchQueries,
  });

  const handleTagChange = (event, value) => {
    if (immediateCommit) {
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
    }
    setTags(value); // Update the default value after changes

    // Notify the parent form of the change
    if (onSelectedTagsChange) {
      onSelectedTagsChange(value);
    }
  };

  return (
    <div className={className}>
      <Autocomplete
        className="w-full"
        multiple
        id="tags-standard"
        options={tagOptions}
        getOptionLabel={(option) => (translationNamespace ? t(`${translationNamespace}:${option.name}`) : option.name)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={label}
            placeholder={placeholder}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'rgb(34, 34, 34)',
              },
            }}
          />
        )}
        onChange={handleTagChange}
        defaultValue={tags}
        limitTags={2}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />
    </div>
  );
};

export default TagSelector;
