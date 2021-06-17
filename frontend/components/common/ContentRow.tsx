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
        "flex flex-col lg:flex-row space-x-0 space-y-24 lg:space-x-6 lg:space-y-0 " +
        className
      }
    >
      {leftTop}
      {rightBottom}
    </div>
  );
};
