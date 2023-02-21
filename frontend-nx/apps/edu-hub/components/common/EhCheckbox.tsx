import { FC } from 'react';
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';

interface IPros {
  checked: boolean;
  text?: string;
}

const EhCheckBox: FC<IPros> = ({ checked, text }) => {
  return (
    <div className="flex flex-row space-x-1 cursor-pointer">
      {checked === true ? (
        <MdCheckBox size="1.5em" />
      ) : (
        <MdCheckBoxOutlineBlank size="1.5em" />
      )}
      {text && (
        <label className="inline-block text-gray-500 cursor-pointer">
          {text}
        </label>
      )}
    </div>
  );
};

export default EhCheckBox;
