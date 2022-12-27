import { FC, ReactNode } from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";

type PageProps = {
  children?: ReactNode;
};

export const Page: FC<PageProps> = ({ children }: PageProps) => {
  return (
    <>
      <div className="flex flex-col max-w-screen-xl mx-auto">
        <Header />
        <main className="">{children}</main>
        <Footer />
      </div>
    </>
  );
};
