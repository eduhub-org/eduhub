import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./common/Button";

export const RegisterButton: FC = () => {
  const { t } = useTranslation();

  return <Button filled>{t("registerButton.title")}</Button>;
};
