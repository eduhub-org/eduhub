import React, { FC, useEffect, useState } from "react";

type ClientOnlyProps = {
  children?: React.ReactNode;
};

// https://www.joshwcomeau.com/react/the-perils-of-rehydration/
export const ClientOnly: FC<ClientOnlyProps> = ({
  children,
}: ClientOnlyProps) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};
