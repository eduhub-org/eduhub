import { FC, useCallback } from "react";
import { StaticComponentProperty } from "../../types/UIComponents";

interface IPros {
  property: StaticComponentProperty;
  onClickCallback: (p: StaticComponentProperty) => any;
}

const EhMenuItem: FC<IPros> = ({ property, onClickCallback }) => {
  const tabClickCallback = useCallback(() => {
    onClickCallback(property);
  }, [onClickCallback, property]);

  return (
    <a
      onClick={tabClickCallback}
      href="#!"
      className={`font-mormal border-b-2 border-solid hover:border-black px-6 focus:outline-none ${
        property.selected ? "border-black font-bold" : "border-white"
      }`}
    >
      {property.label && property.label}
    </a>
  );
};

export default EhMenuItem;
