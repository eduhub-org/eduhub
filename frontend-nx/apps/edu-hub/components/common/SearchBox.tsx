import { ChangeEvent, FC, useCallback } from 'react';
import { DebounceInput } from 'react-debounce-input';
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
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChangeCallback(event.target.value);
    },
    [onChangeCallback]
  );

  return (
    <div className="">
      <div className="flex border-2 rounded">
        <button className="flex items-center justify-center px-4 border-r">
          <MdSearch size={26} />
        </button>
        <DebounceInput
          className="px-4 py-2 focus:outline-none"
          debounceTimeout={debounceTime ?? 1000}
          value={searchText ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus ?? false}
        />
      </div>
    </div>
  );
};

export default SearchBox;
