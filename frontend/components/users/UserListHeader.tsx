import { TFunction } from "next-i18next";
import { FC, useCallback, useState } from "react";
import { StaticComponentProperty } from "../../types/UIComponents";
import EhAddButton from "../common/EhAddButton";
import ModalControl from "../common/ModalController";
import AddUser from "./AddUser";
import EhCheckBox from "../common/EhCheckBox2";

interface IProps {
  t: TFunction;
  checkBoxItems: StaticComponentProperty[];
  handleCheckBoxClick: (changedItems: StaticComponentProperty[]) => void;
  handleAddButtonClick: () => void;
}

const UserListHeader: FC<IProps> = ({
  t,
  checkBoxItems,
  handleCheckBoxClick,
  handleAddButtonClick,
}) => {
  const [menuItems, setMenuItems] = useState(checkBoxItems);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const handCheckBoxClick = useCallback(
    (obj: StaticComponentProperty) => {
      const newItems = menuItems.map((item) => {
        if (obj.key === item.key) return { ...item, selected: !obj.selected };
        return item;
      });
      setMenuItems(newItems);
      handleCheckBoxClick(newItems);
    },
    [setMenuItems, handleCheckBoxClick, menuItems]
  );

  const onCloseAddCourseWindow = useCallback(() => {
    setShowAddUserForm(false);
  }, [setShowAddUserForm]);

  const onAddUserClick = useCallback(() => {
    // handleAddButtonClick();
    setShowAddUserForm(true);
  }, [setShowAddUserForm]);

  const handleCancleOfAddUserForm = useCallback(
    (success) => {
      setShowAddUserForm(false);
      if (success) {
        // refetch userlist
      }
    },
    [setShowAddUserForm]
  );

  return (
    <>
      <div className="flex space-x-5 flex-row">
        {menuItems.map((item) => (
          <EhCheckBox
            key={item.key}
            onClickHandler={handCheckBoxClick}
            property={item}
          />
        ))}
      </div>
      <div className="flex-end">
        <EhAddButton
          buttonClickCallBack={onAddUserClick}
          text={t("addUserButtonText")}
        />
      </div>
      <ModalControl
        modalTitle={t("addUserFormTitle")}
        onClose={onCloseAddCourseWindow}
        showModal={showAddUserForm}
      >
        <AddUser handleCancel={handleCancleOfAddUserForm} t={t} />
      </ModalControl>
    </>
  );
};

export default UserListHeader;
