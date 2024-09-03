import { ChangeEvent, FC, useCallback } from 'react';
import { SelectOption } from '../../types/UIComponents';

interface IProps {
  placeholder?: string;
  options: SelectOption[];
  onChangeHandler: (value: number) => void;
  value?: number;
}

// Function to filter distinct options based on their keys
const distinctOptions = (list: SelectOption[]) => {
  const uniqueOptions: { [key: string]: boolean } = {};
  return list.filter((option) => {
    if (uniqueOptions[option.key]) {
      return false;
    }
    uniqueOptions[option.key] = true;
    return true;
  });
};

const EhSelect: FC<IProps> = ({ placeholder, options, value, onChangeHandler }) => {
  const onSelectChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChangeHandler(Number(event.target.value));
    },
    [onChangeHandler]
  );

  // Ensure options are distinct based on their keys
  const distinctOpts = distinctOptions(options);

  const selectStyle = `form-select
    appearance-none
    block
    w-full
    px-3
    font-normal
    bg-transparent
    transition
    ease-in-out
    border-b border-solid border-gray-300
    m-0
    focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none`;

  return (
    <select
      className={selectStyle}
      aria-label={placeholder ?? ''}
      onChange={onSelectChanged}
      value={value !== undefined ? value : ''}
    >
      {placeholder && (
        <option disabled value="">
          {placeholder}
        </option>
      )}
      {distinctOpts.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default EhSelect;
