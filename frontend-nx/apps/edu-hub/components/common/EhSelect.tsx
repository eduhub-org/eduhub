import { ChangeEvent, FC, useCallback } from "react";
import { SelectOption } from "../../types/UIComponents";

interface IPros {
  placeholder?: string;
  options: SelectOption[];
  onChangeHandler: (value: number) => any;
  value?: number;
}

const distinctOptions = (list: SelectOption[]) => {
  const flags = [];
  const output = [];
  const l = list.length;
  let i;
  for (i = 0; i < l; i++) {
    if (flags[list[i].key]) continue;
    flags[list[i].key] = true;
    output.push(list[i]);
  }
  return output;
};
const EhSelect: FC<IPros> = ({
  placeholder,
  options,
  value,
  onChangeHandler,
}) => {
  const onSelectChanged = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onChangeHandler(parseInt(event.target.value, 10));
    },
    [onChangeHandler]
  );

  options = distinctOptions(options);
  const selectStyle = `form-select
    appearance
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
      value={value}
    >
      {placeholder && (
        <option disabled={true} value="">
          {placeholder}
        </option>
      )}
      {options.map((option, index) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default EhSelect;
