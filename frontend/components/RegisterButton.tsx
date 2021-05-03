import { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./RegisterButton.module.css";

export const RegisterButton: FC = (props) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <span className={styles.title}>{t("registerButton.title")}</span>
    </div>
  );
};
