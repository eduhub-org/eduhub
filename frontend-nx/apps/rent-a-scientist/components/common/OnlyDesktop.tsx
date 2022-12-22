import { FC, ReactNode } from "react";

interface IProps {
  children: ReactNode
}

export const OnlyDesktop: FC<IProps> = ({ children }) => {
  return <div className="hidden sm:flex">{children}</div>;
};
