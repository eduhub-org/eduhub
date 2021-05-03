import React, { FC } from "react";

import { Header } from "./Header";
import styles from "./Page.module.css";

export const Page: FC = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.page}>
        <Header />
        {children}
      </div>
    </div>
  );
};
