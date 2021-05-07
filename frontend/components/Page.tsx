import React, { FC } from "react";

import { Header } from "./Header";

export const Page: FC = ({ children }) => {
  return (
    <>
      <div className="flex max-w-screen-xl mx-auto border-2">
        <div className="flex flex-col">
          <Header />
          <main className="">{children}</main>
        </div>
      </div>
    </>
  );
};
