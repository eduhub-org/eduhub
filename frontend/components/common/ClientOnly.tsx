import { FC, useEffect, useState } from "react";

// https://www.joshwcomeau.com/react/the-perils-of-rehydration/
export const ClientOnly: FC = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};
