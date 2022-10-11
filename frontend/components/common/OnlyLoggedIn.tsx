import { FC } from "react";

import {
  useIsLoggedIn,
  useIsAdmin,
  useIsInstructor,
} from "../../hooks/authentication";

export const OnlyLoggedIn: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();

  if (!isLoggedIn) return null;

  return <>{children}</>;
};

export const OnlyNotAdmin: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  if (!isAdmin && isLoggedIn) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const OnlyNotInstructor: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  if (isLoggedIn && (
    isInstructor ||
    isAdmin )
  ) {
    return null;
  } else {
    return <>{children}</>;
  }
};

export const OnlyAdmin: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  if (isLoggedIn && isAdmin) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const OnlyInstructor: FC = ({ children }) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  if (isLoggedIn && (isInstructor || isAdmin)) {
    return <>{children}</>;
  } else {
    return null;
  }
};
