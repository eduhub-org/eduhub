import { FC } from "react";
import { useTranslation } from "react-i18next";

export const RegisterButton: FC = (props) => {
  const { t } = useTranslation();

  return (
    <div className="border-2 bg-edu-black border-edu-black rounded-full items-center hidden sm:flex">
      <span className="mx-6 text-white">{t("registerButton.title")}</span>
    </div>
  );
};
