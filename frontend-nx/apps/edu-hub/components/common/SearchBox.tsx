import { ChangeEvent, FC, useCallback, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { MdSearch } from 'react-icons/md';

interface IProps {
  placeholder: string;
  searchText: string;
  onChangeCallback: (text: string) => any;
  debounceTime?: number;
  autoFocus?: boolean;
}

const SearchBox: FC<IProps> = ({
  placeholder,
  searchText,
  debounceTime,
  onChangeCallback,
  autoFocus,
}) => {
  // Keep an immediate local value for display and debounce the callback to the
  // parent, mirroring the previous react-debounce-input behavior.
  const [localValue, setLocalValue] = useState(searchText ?? '');

  useEffect(() => {
    setLocalValue(searchText ?? '');
  }, [searchText]);

  const debouncedOnChange = useDebouncedCallback((text: string) => {
    onChangeCallback(text);
  }, debounceTime ?? 1000);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setLocalValue(value);
      debouncedOnChange(value);
    },
    [debouncedOnChange]
  );

  return (
    <div className="">
      <div className="flex border-2 rounded">
        <button className="flex items-center justify-center px-4 border-r">
          <MdSearch size={26} />
        </button>
        <input
          className="px-4 py-2 focus:outline-none text-black"
          value={localValue}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus ?? false}
        />
      </div>
    </div>
  );
};

export default SearchBox;
