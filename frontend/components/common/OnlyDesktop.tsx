import { FC, ReactNode } from "react";

type OnlyDesktopProps = {
  children?: ReactNode;
};

export const OnlyDesktop: FC<OnlyDesktopProps> = ({
  children,
}: OnlyDesktopProps) => {
  return <div className="hidden sm:flex">{children}</div>;
};
