import { FC, useCallback } from 'react';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';

interface IProps {
  course: AdminCourseList_Course;
  onClick: (course: AdminCourseList_Course) => void;
}

const SelectCourseRow: FC<IProps> = ({ course, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(course);
  }, [onClick, course]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-left w-full"
      aria-label={`Select course ${course.title}`}
    >
      <div className="font-medium">{course.title}</div>
      {course.Program?.shortTitle && <div className="text-sm text-gray-600 mt-1">{course.Program.shortTitle}</div>}
      <div className="text-xs text-gray-500 mt-1">ID: {course.id}</div>
    </button>
  );
};

export default SelectCourseRow;
