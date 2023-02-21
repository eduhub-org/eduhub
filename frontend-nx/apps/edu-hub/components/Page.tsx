import { FC, ReactNode } from 'react';

import { Footer } from './Footer';
import { Header } from './Header';

type PageProps = {
  children?: ReactNode;
  className?: string;
};

export const Page: FC<PageProps> = ({ children, className }: PageProps) => {
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
