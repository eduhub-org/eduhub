import { FC, useCallback } from "react";
import { UserForSelection1_User } from "../../../queries/__generated__/UserForSelection1";

interface IProps {
  user: UserForSelection1_User;
  onClick: (user: UserForSelection1_User) => any;
}

const SelectUserRow: FC<IProps> = ({ user, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(user);
  }, [onClick, user]);

  return (
    <div
      onClick={handleClick}
      className="w-full truncate mt-2 mb-2 cursor-pointer even:bg-edu-light-gray"
    >
      {`${user.firstName} ${user.lastName} (${user.email})`}
    </div>
  );
};

export default SelectUserRow;
