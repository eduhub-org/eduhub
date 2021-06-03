import Link from "next/link";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "./common/Button";

export const LoginButton: FC = () => {
  const { t } = useTranslation();

  return (
    <Link href="/login">
      <a className="flex">
        <Button>{t("loginButton.title")}</Button>
      </a>
    </Link>
  );
};
