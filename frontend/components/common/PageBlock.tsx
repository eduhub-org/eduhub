import { Children, FC } from "react";

export const PageBlock: FC = ({ children }) => {
  return <div className="mx-6 xl:mx-0">{children}</div>;
};
