import { FC } from "react";

import { useIsLoggedIn } from "../../hooks/authentication";

export const OnlyLoggedIn: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();

  if (!isLoggedIn) return null;

  return <>{children}</>;
};
