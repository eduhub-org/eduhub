import { FC, ReactElement, ReactNode } from "react";

import {
  useIsAdmin,
  useIsInstructor,
  useIsLoggedIn,
} from "../../hooks/authentication";

type TProps = {
  children?: ReactElement;
};

export const OnlyLoggedIn: FC<TProps> = ({ children }: TProps) => {
  const isLoggedIn = useIsLoggedIn();

  if (!isLoggedIn) return null;

  return <>{children}</>;
};

export const OnlyNotAdmin: FC<TProps> = ({ children }: TProps) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  if (!isAdmin && isLoggedIn) {
    return <>{children}</>;
  } else {
    return null;
  }
};

export const OnlyNotInstructor: FC<TProps> = ({ children }: TProps) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  if (isLoggedIn && (isInstructor || isAdmin)) {
    return null;
  } else {
    return <>{children}</>;
  }
};

type OnlyAdminProps = {
  children: ReactNode | ReactNode[];
};
export const OnlyAdmin: FC<OnlyAdminProps> = ({ children }: OnlyAdminProps) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();

  if (isLoggedIn && isAdmin) {
    return <>{children}</>;
  } else {
    return null;
  }
};
export const OnlyInstructor: FC<TProps> = ({ children }: TProps) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  if (isLoggedIn && (isInstructor || isAdmin)) {
    return <>{children}</>;
  } else {
    return null;
  }
};
