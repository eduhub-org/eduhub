import { FC } from "react";
import { useTranslation } from "react-i18next";

export const LoginButton: FC = (props) => {
  const { t } = useTranslation();

  return (
    <div className="">
      <span style={{ margin: "0 16px" }}>{t("loginButton.title")}</span>
    </div>
  );
};

// .container {
//   align-items: center;
//   border-radius: 50px;
//   border-style: solid;
//   border-width: 2px;
//   display: flex;
//   justify-content: center;
// }

// @media (min-width: 768px) {
//   .container {
//     border-style: none;
//   }
// }
