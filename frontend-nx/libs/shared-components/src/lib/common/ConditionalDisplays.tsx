import React, { FC, ReactNode, useEffect, useState } from "react";

type OnlyDesktopProps = {
    children?: ReactNode;
};

export const OnlyDesktop: FC<OnlyDesktopProps> = ({
    children,
}: OnlyDesktopProps) => {
    return <div className="hidden sm:flex">{children}</div>;
};


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

    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
};
