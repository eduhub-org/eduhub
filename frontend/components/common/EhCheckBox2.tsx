import { FC, useCallback } from "react";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import { StaticComponentProperty } from "../../types/UIComponents";

interface IProps {
  property: StaticComponentProperty;
  onClickHandler: (property: StaticComponentProperty) => void;
}
const EhCheckBox: FC<IProps> = ({ property, onClickHandler }) => {
  return (
    <div
      className="flex flex-row space-x-1 cursor-pointer"
      onClick={useCallback(() => onClickHandler(property), [
        onClickHandler,
        property,
      ])}
    >
      {property.selected ? (
        <MdCheckBox size="1.5em" />
      ) : (
        <MdCheckBoxOutlineBlank size="1.5em" />
      )}
      {property.label && (
        <label className="inline-block text-gray-800 cursor-pointer">
          {property.label}
        </label>
      )}
    </div>
  );
};
export default EhCheckBox;
