import { FC, useCallback, useState } from "react";
import { TextBoxProperties } from "../../types/UIComponents";

interface IPropsPassword {
  property: TextBoxProperties;
}
const EhPassword: FC<IPropsPassword> = ({ property }) => {
  const [show, setShow] = useState(false);
  const handOnchange = useCallback(
    (event) => {
      property.onChangeHandler(property.key, event.target.value);
    },
    [property]
  );

  const handleShowHide = useCallback(() => {
    setShow(!show);
  }, [setShow, show]);

  return (
    <div
      className="transition
        ease-in-out
        w-full
        border-b border-solid border-gray-300
        focus:border-blue-600 focus:outline-none
        flex
        justify-between"
    >
      <input
        className="border-0 focus:outline-none"
        type={show ? "text" : "password"}
        placeholder={property.placeHolder}
        onChange={handOnchange}
      />
      <label className="cursor-pointer" onClick={handleShowHide}>
        {show ? "hide" : "show"}
      </label>
    </div>
  );
};

export default EhPassword;
