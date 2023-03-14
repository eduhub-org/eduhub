import { FC } from 'react';
import { signIn } from 'next-auth/react';

import { useIsLoggedIn } from '../../hooks/authentication';
import { Course_Course_by_pk } from '../../queries/__generated__/Course';

import { ApplyButtonBlock } from './ApplyButtonBlock';
import { EnrollmentStatus } from './EnrollmentStatus';

interface IProps {
  course: Course_Course_by_pk;
  invited?: boolean;
}
const signInHandler = () => {
  console.log('signIN!');
  return signIn('keycloak');
};

export const CourseStatus: FC<IProps> = ({ course, invited }) => {
  const isLoggedIn = useIsLoggedIn();

  return (
    <div className="flex flex-1 lg:max-w-md">
      {isLoggedIn ? (
        <EnrollmentStatus course={course} invited={invited} />
      ) : (
        <ApplyButtonBlock course={course} onClickApply={signInHandler} />
      )}
    </div>
  );
};
