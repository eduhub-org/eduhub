import React, { FC, ReactNode, useEffect, useState } from 'react';
import { BREAKPOINTS } from '../../config/breakpoints';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export interface OnlyDesktopProps {
  children?: ReactNode;
}

export const OnlyDesktop: FC<OnlyDesktopProps> = ({ children }: OnlyDesktopProps) => {
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  if (!isDesktop) {
    return null;
  }

  return <>{children}</>;
};

export interface ClientOnlyProps {
  children?: React.ReactNode;
}

// https://www.joshwcomeau.com/react/the-perils-of-rehydration/
export const ClientOnly: FC<ClientOnlyProps> = ({ children }: ClientOnlyProps) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};
