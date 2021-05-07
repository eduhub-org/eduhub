import React, { FC } from "react";

import { Header } from "./Header";

export const Page: FC = ({ children }) => {
  return (
    <>
      <div className="flex flex-col max-w-screen-xl mx-auto border-2">
        <Header />
        <main className="">{children}</main>
      </div>
    </>
  );
};
