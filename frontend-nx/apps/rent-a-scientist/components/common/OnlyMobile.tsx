import { FC, ReactNode } from "react";

interface Props {
  children: ReactNode
}

export const OnlyDesktop: FC<Props> = ({ children }) => {
  return <div className="flex sm:hidden">{children}</div>;
};
