import { FC, useCallback } from "react";
import {
  SelectComponentProperty,
  SelectOption,
} from "../../types/UIComponents";

interface IProsSelect {
  componentProperty: SelectComponentProperty;
  selelectedValue: any;
}

const UserSelect: FC<IProsSelect> = ({
  componentProperty,
  selelectedValue,
}) => {
  const onSelectChanged = useCallback(
    (event) => {
      componentProperty.onChangeHandler(
        componentProperty.componentID,
        event.target.value
      );
    },
    [componentProperty]
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
      onChange={onSelectChanged}
      value={selelectedValue ?? ""}
    >
      {componentProperty.options.map((option, index) => (
        <option key={option.value} value={option.value}>
          {option.comment}
        </option>
      ))}
    </select>
  );
};

export default UserSelect;
