import { FC, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';

import useLogout from '../hooks/logout';

import { Footer } from './Footer';
import { Header } from './Header';

type PageProps = {
  children?: ReactNode;
  className?: string;
};

export const Page: FC<PageProps> = ({ children, className }: PageProps) => {
  const { data: session, status } = useSession();
  const logout = useLogout();

  useEffect(() => {
    if (status !== 'loading' && session?.error === 'RefreshAccessTokenError') {
      logout();
    }
  }, [status, session, logout]);

  return (
    <>
      <div className={`flex flex-col ${className}`}>
        <Header />
        <main className="">{children}</main>
        <Footer />
      </div>
    </>
  );
};
