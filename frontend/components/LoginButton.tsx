import { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./LoginButton.module.css";

export const LoginButton: FC = (props) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <span style={{ margin: "0 16px" }}>{t("loginButton.title")}</span>
    </div>
  );
};
