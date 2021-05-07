import { FC } from "react";
import { useTranslation } from "react-i18next";

export const RegisterButton: FC = (props) => {
  const { t } = useTranslation();

  return (
    <div className="">
      <span className="">{t("registerButton.title")}</span>
    </div>
  );
};

// .container {
//   display: none;
// }

// @media (min-width: 768px) {
//   .container {
//     align-items: center;
//     border-radius: 50px;
//     border-style: solid;
//     border-width: 2px;
//     display: flex;
//     justify-content: center;
//     background-color: black;
//   }
// }

// .title {
//   color: white;
//   margin: 0 16px;
// }
