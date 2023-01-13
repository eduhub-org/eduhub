import { Dialog, DialogContent, DialogTitle } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useAdminQuery } from '../../hooks/authedQuery';
import { QUERY_LIMIT } from '../../pages/courses';
import { ADMIN_COURSE_LIST } from '../../queries/courseList';
import {
  AdminCourseList,
  AdminCourseListVariables,
  AdminCourseList_Course,
} from '../../queries/__generated__/AdminCourseList';
import { Button } from '../common/Button';
import SearchBox from '../common/SearchBox';

interface IProps {
  title: string;
  onClose: (confirmed: boolean, user: AdminCourseList_Course | null) => void;
  open: boolean;
}

const CourseListDialog: FC<IProps> = (props) => {
  const [searchValue, setSearchValue] = useState('');
  const { t } = useTranslation();

  const handleCancel = useCallback(() => {
    setSearchValue('');
    props.onClose(false, null);
  }, [props]);

  const courseListRequest = useAdminQuery<
    AdminCourseList,
    AdminCourseListVariables
  >(ADMIN_COURSE_LIST, {
    variables: {
      limit: QUERY_LIMIT,
      offset: 0,
      where: { title: { _ilike: `%${searchValue}%` } },
    },
    skip: searchValue.trim().length < 3,
  });

  const handleNewInput = useCallback(
    (value) => {
      setSearchValue(value);
    },
    [setSearchValue]
  );

  const onCourseClick = useCallback(
    (course: AdminCourseList_Course) => {
      setSearchValue('');
      props.onClose(false, course);
    },
    [setSearchValue, props]
  );
  const courses = courseListRequest.data?.Course || [];
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
        <div>
          Suche Kurse by title.
          <br />
          Mindestens 3 Buchstaben eingeben. <br />
          Kurse per Klick auswählen.
        </div>

        <div className="py-2">
          <SearchBox
            placeholder="Suchwert"
            onChangeCallback={handleNewInput}
            searchText={searchValue}
            autoFocus={true}
          />
        </div>

        {props.open && (
          <div className="h-[32rem] w-[26rem] overflow-auto">
            {courses.map((course, index) => (
              <div key={index} className="pb-1">
                <TagWithTwoText course={course} onClick={onCourseClick} />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center my-2">
          <Button onClick={handleCancel}>{t('cancel')}</Button>
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseListDialog;

interface IPropsCourse {
  course: AdminCourseList_Course;
  onClick: (c: AdminCourseList_Course) => void;
}

const TagWithTwoText: FC<IPropsCourse> = ({ course, onClick }) => {
  const clickThis = useCallback(() => {
    onClick(course);
  }, [onClick, course]);
  return (
    <div
      onClick={clickThis}
      className="flex justify-between bg-edu-row-color 
      px-2 py-1 cursor-pointer border border-slate-300 hover:border-solid hover:border-indigo-300"
    >
      <div className="pr-1 w-full flex justify-between">
        <p className="pr-2 ">{`${course.title} (id:${course.id})`}</p>
        {course.Program?.shortTitle && (
          <p className="font-medium ">{course.Program?.shortTitle}</p>
        )}
      </div>
    </div>
  );
};
