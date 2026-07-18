import { FC, ReactElement, ReactNode } from "react";
import { useTranslations } from 'next-intl';

import {
  useIsAdmin,
  useIsInstructor,
  useIsLoggedIn,
  useIsOrgAdmin,
} from "../../hooks/authentication";

type TProps = {
  children?: ReactElement<any>;
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
  showFeedback?: boolean;
};
export const OnlyAdmin: FC<OnlyAdminProps> = ({ children, showFeedback = false }: OnlyAdminProps) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const t = useTranslations('common');

  if (isLoggedIn && isAdmin) {
    return <>{children}</>;
  }

  if (showFeedback) {
    return (
      <div className="text-center py-8">
        {!isLoggedIn ? t('auth.please_log_in') : t('auth.access_denied')}
      </div>
    );
  }

  return null;
};
// Renders children for organization admins (or super-admins, who can do everything).
export const OnlyOrgAdmin: FC<TProps> = ({ children }: TProps) => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  if (isLoggedIn && (isOrgAdmin || isAdmin)) {
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
