import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./common/Button";
import { OnlyDesktop } from "./common/OnlyDesktop";

export const RegisterButton: FC = () => {
  const { t } = useTranslation();

  return (
    <OnlyDesktop>
      <Button filled>{t("registerButton.title")}</Button>
    </OnlyDesktop>
  );
};
