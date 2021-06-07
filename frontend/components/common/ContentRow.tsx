import { FC, ReactNode } from "react";

interface IProps {
  className?: string;
  leftTop: ReactNode;
  rightBottom?: ReactNode;
}

export const ContentRow: FC<IProps> = ({
  leftTop,
  rightBottom = null,
  className = "",
}) => {
  return (
    <div
      className={
        "flex flex-col sm:flex-row space-x-0 space-y-24 sm:space-x-24 sm:space-y-0 " +
        className
      }
    >
      <div className="flex flex-1">{leftTop}</div>
      <div className="flex flex-1">{rightBottom}</div>
    </div>
  );
};