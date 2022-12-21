import { FC, ReactElement } from "react";

type OnlyDesktopProps = {
  children?: ReactElement;
};

export const OnlyDesktop: FC<OnlyDesktopProps> = ({
  children,
}: OnlyDesktopProps) => {
  return <div className="flex sm:hidden">{children}</div>;
};
