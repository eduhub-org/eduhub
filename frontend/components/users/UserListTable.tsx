import { TFunction } from "next-i18next";
import { FC } from "react";
import { UesrsByLastName_User } from "../../queries/__generated__/UesrsByLastName";
import { StaticComponentProperty } from "../../types/UIComponents";

interface IProps {
  t: TFunction;
  users: UesrsByLastName_User[];
}
const UserListTable: FC<IProps> = ({ t, users }) => {
  const tableHeaders: StaticComponentProperty[] = [
    { key: 0, label: t("firstName") },
    { key: 1, label: t("lastName") },
    { key: 2, label: t("email") },
    { key: 3, label: t("regDate") },
  ];
  return (
    <div className="overflow-x-auto transition-[height] w-full">
      <table className="w-full">
        <thead>
          <tr className="focus:outline-none h-16 ">
            {tableHeaders.map((component) => {
              return (
                <th key={component.key} className="py-2 px-10">
                  <p className="flex justify-start font-medium text-gray-700 uppercase">
                    {component.label}
                  </p>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserOneRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserListTable;

/** Details of Row */
interface IPropsUser {
  user: UesrsByLastName_User;
}

const UserOneRow: FC<IPropsUser> = ({ user }) => {
  const pStyle = "text-gray-700 truncate";
  const tdStyple = "font-medium bg-edu-course-list py-2 px-10 ";

  return (
    <>
      <tr>
        <td className={tdStyple}>
          <p className={pStyle}>{user.firstName}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyle}>{user.lastName}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyle}>{user.email}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyle}> {"//TODO"} </p>
        </td>
      </tr>
      <tr className="h-1" />
    </>
  );
};
