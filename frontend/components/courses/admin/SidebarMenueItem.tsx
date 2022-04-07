import { FC, useCallback } from "react";
import { SelectOption } from "../../../types/UIComponents";

interface IProps {
  selectedOption: SelectOption;
  object: SelectOption;
  onClickHandler: (clickedObject: SelectOption) => void;
}

const SidebarMenuItem: FC<IProps> = ({
  selectedOption,
  object,
  onClickHandler,
}) => {
  const onClick = useCallback(() => {
    onClickHandler(object);
  }, [onClickHandler, object]);

  return (
    <li
      onClick={onClick}
      className={`border-b-2 border-solid hover:border-black ${
        object.key === selectedOption.key ? "border-black" : "border-white"
      }`}
    >
      <a
        className="
        flex 
        text-edu-modal-bg-color 
          text-lg 
          text-ellipsis whitespace-nowrap
        py-4 px-3 
        h-12 
        overflow-hidden
        transition duration-300 ease-in-out"
        href="#!"
      >
        {object.label}
      </a>
    </li>
  );
};

export default SidebarMenuItem;
