import { FC, useCallback } from "react";
import { SelectOption } from "../../types/UIComponents";

interface IPros {
  placeholder?: string;
  options: SelectOption[];
  onChangeHandler: (value: string) => any;
  value?: string;
}
const EhSelect: FC<IPros> = ({
  placeholder,
  options,
  value,
  onChangeHandler,
}) => {
  const onSelectChanged = useCallback(
    (event) => {
      onChangeHandler(event.target.value);
    },
    [onChangeHandler]
  );

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
      aria-label={placeholder ?? ""}
      onChange={onSelectChanged}
      value={value ?? ""}
    >
      {options.map((option, index) => (
        <option key={`${option.value}-${index}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default EhSelect;
