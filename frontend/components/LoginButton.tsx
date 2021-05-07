import { FC } from "react";
import { useTranslation } from "react-i18next";

export const LoginButton: FC = (props) => {
  const { t } = useTranslation();

  return (
    <div className="flex border-2 border-black rounded-full items-center sm:border-none">
      <span className="mx-6">{t("loginButton.title")}</span>
    </div>
  );
};
