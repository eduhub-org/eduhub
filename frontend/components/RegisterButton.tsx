import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./common/Button";

export const RegisterButton: FC = () => {
  const { t } = useTranslation();

  return (
    <Link href="/register">
      <a className="flex">
        <Button filled>{t("registerButton.title")}</Button>
      </a>
    </Link>
  );
};
