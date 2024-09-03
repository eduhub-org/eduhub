import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { AtLeastNameEmail } from '../../../helpers/achievement';
import { COURSE_ENROLLMENTS_WITH_USER } from '../../../queries/courseEnrollment';
import {
  CourseEnrollmentWithUserQuery,
  CourseEnrollmentWithUserQueryVariables,
} from '../../../queries/__generated__/CourseEnrollmentWithUserQuery';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { makeFullName } from '../../../helpers/util';
import { useAuthedQuery } from '../../../hooks/authedQuery';
import { Button } from '../Button';
import SearchBox from '../SearchBox';

interface IProps {
  title: string;
  onClose: (confirmed: boolean, tempUser: AtLeastNameEmail) => void;
  open: boolean;
  courseId: number;
}

const EnrolledUserForACourseDialog: FC<IProps> = (props) => {
  const [searchValue, setSearchValue] = useState('');
  const { t } = useTranslation();

  const handleCancel = useCallback(() => {
    setSearchValue('');
    props.onClose(false, null);
  }, [props]);

  const experts = useAuthedQuery<
    CourseEnrollmentWithUserQuery,
    CourseEnrollmentWithUserQueryVariables
  >(COURSE_ENROLLMENTS_WITH_USER, {
    variables: {
      limit: 15,
      offset: 0,
      where: {
        _and: [
          {
            courseId: { _eq: props.courseId },
          },
          {
            _or: [
              { User: { firstName: { _ilike: `%${searchValue}%` } } },
              { User: { lastName: { _ilike: `%${searchValue}%` } } },
              { User: { email: { _ilike: `%${searchValue}%` } } },
            ],
          },
        ],
      },
    },
    skip: searchValue.trim().length < 3,
  });

  const handleNewInput = useCallback(
    (value: string) => {
      setSearchValue(value);
    },
    [setSearchValue]
  );

  const onUserClick = useCallback(
    (tempUser: AtLeastNameEmail) => {
      setSearchValue('');
      props.onClose(false, tempUser);
    },
    [setSearchValue, props]
  );
  const users = experts.data?.CourseEnrollment || [];

  return (
    <Dialog open={props.open} onClose={handleCancel}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{props.title}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <DialogContent>
        <p>{t('type-name-email-minimum-3-letters')}</p>
        <div className="py-2">
          <SearchBox
            placeholder={t('search-value')}
            onChangeCallback={handleNewInput}
            searchText={searchValue}
            autoFocus={true}
          />
        </div>

        {props.open && (
          <div className="h-[30rem] w-full overflow-auto">
            {users.map((cEnrollment, index) => (
              <div key={index} className="pb-1">
                <TagWithTwoText
                  tempUser={cEnrollment.User}
                  onClick={onUserClick}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center my-2">
          <div>
            <Button onClick={handleCancel}>{t('cancel')}</Button>
          </div>
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrolledUserForACourseDialog;

interface IPropsCourse {
  tempUser: AtLeastNameEmail;
  onClick: (e: AtLeastNameEmail) => void;
}

const TagWithTwoText: FC<IPropsCourse> = ({ tempUser, onClick }) => {
  const clickThis = useCallback(() => {
    onClick(tempUser);
  }, [onClick, tempUser]);
  return (
    <div
      onClick={clickThis}
      className="flex flex-col bg-edu-row-color px-2 py-1 cursor-pointer border border-slate-300 hover:border-solid hover:border-indigo-300"
    >
      <p className="pr-2">
        {makeFullName(tempUser.firstName, tempUser.lastName)}
      </p>
      <p className="text-gray-600">{tempUser.email}</p>
    </div>
  );
};
