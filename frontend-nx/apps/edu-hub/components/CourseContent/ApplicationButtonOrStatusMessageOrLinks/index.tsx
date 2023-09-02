import { Dispatch, FC, SetStateAction } from 'react';
import { signIn } from 'next-auth/react';
import useTranslation from 'next-translate/useTranslation';

import { useIsLoggedIn } from '../../../hooks/authentication';
import { Course_Course_by_pk } from '../../../queries/__generated__/Course';

import { ApplyButton } from './ApplyButton';
import { EnrollmentUIController } from './EnrollmentUIController';
import Trans from 'next-translate/Trans';

interface IProps {
  course: Course_Course_by_pk;
  setInvitationModalOpen: Dispatch<SetStateAction<boolean>>;
}
const signInHandler = () => {
  console.log('signIN!');
  return signIn('keycloak');
};

export const ApplicationButtonOrStatusMessageOrLinks: FC<IProps> = ({
  course,
  setInvitationModalOpen,
}) => {
  const isLoggedIn = useIsLoggedIn();

  let content = null;

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (course.applicationEnd <= currentDate) {
    content = (
      <div className="flex">
        <span className="bg-gray-300 p-4">
          <Trans
            i18nKey="course-application:status.applicationPeriodEnded"
            components={{
              a: (
                <a
                  href="https://opencampus.substack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                />
              ),
            }}
          />
        </span>
      </div>
    );
  } else {
    content = <ApplyButton course={course} onClickApply={signInHandler} />;
  }
  return (
    <div className="flex flex-1 lg:max-w-md">
      {isLoggedIn ? (
        <EnrollmentUIController
          course={course}
          setInvitationModalOpen={setInvitationModalOpen}
        />
      ) : (
        <div className="mx-auto">{content}</div>
      )}
    </div>
  );
};
