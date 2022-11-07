import { FC, ReactElement } from "react";

import { useIsLoggedIn } from "../../hooks/authentication";

type OnlyLoggedOutProps = {
  children?: ReactElement;
};

export const OnlyLoggedOut: FC<OnlyLoggedOutProps> = ({
  children,
}: OnlyLoggedOutProps) => {
  const isLoggedIn = useIsLoggedIn();

  if (isLoggedIn) return null;

  return <>{children}</>;
};
