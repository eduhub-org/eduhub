import { FC } from "react";

import { useIsLoggedIn } from "../../hooks/authentication";

export const OnlyLoggedOut: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();

  if (isLoggedIn) return null;

  return <>{children}</>;
};
