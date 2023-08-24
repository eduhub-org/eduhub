import React from 'react';
import { Autocomplete as MuiAutocomplete } from '@material-ui/lab';
import { TextField } from '@material-ui/core';

export const createHandleTagChange = (
  tags: { id: number }[],
  deleteTagFromItem: (id: number) => void,
  insertTagIntoItem: (id: number) => void,
  setTags: React.Dispatch<React.SetStateAction<{ id: number }[]>>,
  refetchCourses: () => void
) => {
  return (event, value) => {
    const removedTag = tags.find((tag) => !value.includes(tag));
    const addedTag = value.find((tag) => !tags.includes(tag));

    if (removedTag) {
      deleteTagFromItem(removedTag.id);
    }

    if (addedTag) {
      insertTagIntoItem(addedTag.id);
    }

    setTags(value);
    refetchCourses();
  };
};

interface Tag {
  id: number;
  title: string;
}

interface TagSelectorProps<T> {
  options: T[];
  getOptionLabel: (option: T) => string;
  label: string;
  placeholder: string;
  onChange: (event: React.ChangeEvent<unknown>, value: T[]) => void;
  defaultValue: T[];
}

export function TagSelector<T>(props: TagSelectorProps<T>) {
  const {
    options,
    getOptionLabel,
    label,
    placeholder,
    onChange,
    defaultValue,
  } = props;

  return (
    <div className="col-span-10 flex mt-3">
      <MuiAutocomplete
        className="w-3/4"
        multiple
        id="tags-standard"
        options={options}
        getOptionLabel={getOptionLabel}
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
        onChange={onChange}
        defaultValue={defaultValue}
        limitTags={2}
        getOptionSelected={(option, value) => option.id === value.id}
      />
    </div>
  );
}
