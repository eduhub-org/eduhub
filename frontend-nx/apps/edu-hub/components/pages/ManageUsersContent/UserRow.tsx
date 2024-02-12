import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { UsersByLastName_User } from '../../queries/__generated__/UsersByLastName';

interface IProps {
  row: UsersByLastName_User;
}


const UserRow: FC<IProps> = ({ row }) => {
  const { t } = useTranslation('common');
  return (
    <div>
      <div className="font-medium bg-edu-course-list grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('common:status')}: ${
            row.employment ? t(`common:${row.employment}`) : '-'
          }`}</p>
        </div>
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('common:matriculation-number')}: ${
            row.matriculationNumber ? row.matriculationNumber : '-'
          }`}</p>
        </div>
        <div className="pl-3 col-span-3">
          <p className="text-gray-700 truncate font-medium">{`${t('common:university')}: ${
            row.university ? t(`common:${row.university}`) : '-'
          }`}</p>
        </div>
      </div>
      <div className="font-medium bg-edu-course-list flex py-4">
        <div className="pl-3">
          {row.CourseEnrollments.map((enrollment, index) => (
            <p key={index} className="text-gray-600 truncate text-sm">
              {enrollment.Course.title} ({enrollment.Course.Program.shortTitle}) - {enrollment.status}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserRow;
