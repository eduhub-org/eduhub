import { FC } from "react";

export const OnlyDesktop: FC = ({ children }) => {
  return <div className="flex sm:hidden">{children}</div>;
};
