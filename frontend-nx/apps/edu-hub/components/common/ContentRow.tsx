import { FC, ReactNode } from "react";

interface IProps {
  className?: string;
  children: ReactNode;
}

export const ContentRow: FC<IProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={
        "flex flex-col lg:flex-row space-x-0 space-y-4 lg:space-x-6 lg:space-y-0 " +
        className
      }
    >
      {children}
    </div>
  );
};
