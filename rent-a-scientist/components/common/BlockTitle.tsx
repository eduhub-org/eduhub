import { FC } from "react";

interface IProps {
  children: string;
}

export const BlockTitle: FC<IProps> = ({ children }) => {
  return <h2 className="text-5xl">{children}</h2>;
};
