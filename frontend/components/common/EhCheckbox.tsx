import { FC } from "react";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";

interface IPros {
  checked: boolean;
}

const EhCheckBox: FC<IPros> = ({ checked }) => {
  return (
    <div
      className="bg-gray-200 
              rounded-sm w-5 
              h-5 
              flex flex-shrink-0 
              justify-center items-center 
              relative 
              cursor-pointer"
    >
      {checked === true ? (
        <MdCheckBox size="1.5em" />
      ) : (
        <MdCheckBoxOutlineBlank size="1.5em" />
      )}
    </div>
  );
};

export default EhCheckBox;
