import { TFunction } from "next-i18next";
import { FC, useCallback, useState } from "react";
import {
  SelectOption,
  StaticComponentProperty,
} from "../../../types/UIComponents";
import CommonPageHeader from "../../common/CommonPageHeader";
import CourseList from "./CourseList";
import Sidebar from "./Sidebar";

interface IProps {
  t: TFunction;
}
const Dashboard: FC<IProps> = ({ t }) => {
  // TODO: Come up with Valid Category
  const sidebarItems: StaticComponentProperty[] = [
    { key: 0, label: "All Programs", selected: true },
    { key: 1, label: "Tech", selected: false },
    { key: 2, label: "Business", selected: false },
    { key: 3, label: "Creative", selected: false },
    { key: 4, label: "Programmieren", selected: false },
  ];

  const [selected, setSelected] = useState(sidebarItems[0]);

  /* #region Callbacks */
  const handleMenuClick = useCallback(
    (key: StaticComponentProperty) => {
      setSelected(key);
    },
    [setSelected]
  );
  /* #endregion */

  return (
    <>
      <CommonPageHeader headline={t("headline")} />
      <div className="flex flex-row py-5 space-x-5">
        <div className="w-3/12 flex">
          <Sidebar
            handleMenuSelection={handleMenuClick}
            sidebarItems={sidebarItems}
          />
        </div>
        <div className="w-9/12">{<CourseList selectedOption={selected} />}</div>
      </div>
    </>
  );
};

export default Dashboard;
