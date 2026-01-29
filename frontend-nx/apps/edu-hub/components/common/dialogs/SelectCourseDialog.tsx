import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ChangeEvent, FC, useCallback, useState, useMemo } from 'react';
import { MdClose } from 'react-icons/md';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { ADMIN_COURSE_LIST } from '../../../queries/courseList';
import {
  AdminCourseList,
  AdminCourseListVariables,
  AdminCourseList_Course,
} from '../../../queries/__generated__/AdminCourseList';
import { createMultiWordSearchCondition } from '../../../helpers/searchUtils';
import { order_by } from '../../../__generated__/globalTypes';

import { Button } from '../Button';
import SelectCourseRow from './SelectCourseRow';
import { ErrorMessageDialog } from './ErrorMessageDialog';

interface IProps {
  title: string;
  onClose: (confirmed: boolean, course: AdminCourseList_Course | null) => void;
  open: boolean;
}

// Search course by title
// then select the course from a list
export const SelectCourseDialog: FC<IProps> = ({ onClose, open, title }) => {
  const [searchValue, setSearchValue] = useState('');
  const t = useTranslations('common.dialogs');

  const handleNewInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchValue(event.target.value);
    },
    []
  );

  const handleCancel = useCallback(() => {
    setSearchValue('');
    onClose(false, null);
  }, [onClose]);

  const handleConfirm = useCallback(
    (course: AdminCourseList_Course) => {
      setSearchValue('');
      onClose(true, course);
    },
    [onClose]
  );
  // Create filter condition using multi-word search
  const shouldSearch = searchValue.trim().length >= 2;
  const filter = useMemo(() => {
    if (!shouldSearch) {
      return {};
    }
    return createMultiWordSearchCondition(searchValue.trim(), ['title']);
  }, [searchValue, shouldSearch]);

  // Query courses with dynamic filter
  const { data, loading, error } = useAdminQuery<AdminCourseList, AdminCourseListVariables>(
    ADMIN_COURSE_LIST,
    {
      variables: {
        limit: 100,
        offset: 0,
        where: filter,
        order_by: [{ title: order_by.asc }],
      },
      skip: !open || !shouldSearch,
    }
  );

  const courses = shouldSearch ? data?.Course || [] : [];
  const hasSearched = shouldSearch;
  const showNoResults = hasSearched && !loading && !error && courses.length === 0;

  return (
    <>
      <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{title}</div>
          <button
            className="cursor-pointer flex justify-end"
            onClick={handleCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCancel();
              }
            }}
            aria-label={t('close')}
          >
            <MdClose />
          </button>
        </div>
      </DialogTitle>

      <DialogContent>
        <div className="mb-4">{t('select_course_dialog.type_course_name_minimum_2_letters')}</div>

        <div className="mb-4">
          <input
            placeholder={t('search')}
            className="w-full border border-solid border-gray-300 rounded px-3 py-2"
            type="text"
            value={searchValue}
            onChange={handleNewInput}
          />
        </div>

        <div className="h-[32rem] overflow-auto border border-gray-200 rounded">
          {courses.length > 0 &&
            courses.map((course) => (
              <SelectCourseRow course={course} key={course.id} onClick={handleConfirm} />
            ))}
          {showNoResults && (
              <div className="p-4 text-center text-gray-500">{t('select_course_dialog.no_courses_found')}</div>
            )}
            {loading && hasSearched && (
              <div className="p-4 text-center text-gray-500">{t('loading')}</div>
            )}
            {searchValue.trim().length < 2 && (
              <div className="p-4 text-center text-gray-500">{t('select_course_dialog.type_course_name_minimum_2_letters')}</div>
            )}
          </div>

          <div className="grid grid-cols-2 mt-4">
            <div>
              <Button onClick={handleCancel}>{t('cancel')}</Button>
            </div>
            <div />
          </div>
        </DialogContent>
      </Dialog>

      {error && open && (
        <ErrorMessageDialog
          errorMessage={error.message || t('error')}
          open={!!error && open}
          onClose={handleCancel}
        />
      )}
    </>
  );
};
