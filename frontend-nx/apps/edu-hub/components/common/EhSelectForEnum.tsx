import { FC, useCallback } from "react";

interface IProsSelect {
  options: string[];
  selected?: string;
  bg?: string;
  placeholder?: string;
  onChange: (selected: string) => void;
}

const EhSelectForEnum: FC<IProsSelect> = ({
  options,
  selected,
  bg,
  placeholder,
  onChange,
}) => {
  const onSelectChanged = useCallback(
    (event) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const selectStyle = `form-select h-12
      appearance
      block
      w-full
      px-3
      font-normal
      bg-white
      transition
      ease-in-out
      border 
      border-solid border-gray-300
      focus:text-black focus:bg-white focus:border-blue-600 focus:outline-none`;

  return (
    <select
      className={selectStyle}
      aria-label={placeholder ?? ""}
      onChange={onSelectChanged}
      value={selected}
      placeholder={placeholder ?? ""}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default EhSelectForEnum;
