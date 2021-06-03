import { FC } from "react";

export const OnlyDesktop: FC = ({ children }) => {
  return <div className="hidden sm:flex">{children}</div>;
};
