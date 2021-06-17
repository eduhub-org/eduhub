import { FC } from "react";

interface IProps {
  classname?: string;
}

export const PageBlock: FC<IProps> = ({ children, classname }) => {
  return <div className={`mx-6 xl:mx-0 ${classname}`}>{children}</div>;
};
