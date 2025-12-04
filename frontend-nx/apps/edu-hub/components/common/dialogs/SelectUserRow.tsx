import { FC, useCallback } from "react";
import { UserSelectionWithFilter_User } from "../../../queries/__generated__/UserSelectionWithFilter";

interface IProps {
  user: UserSelectionWithFilter_User;
  onClick: (user: UserSelectionWithFilter_User) => any;
}

const SelectUserRow: FC<IProps> = ({ user, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(user);
  }, [onClick, user]);

  return (
    <div
      onClick={handleClick}
      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
    >
      <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
      {user.email && <div className="text-sm text-gray-600 mt-1">{user.email}</div>}
    </div>
  );
};

export default SelectUserRow;
