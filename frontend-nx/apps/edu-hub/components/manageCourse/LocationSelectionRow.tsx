import { IconButton } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { ChangeEvent, FC, useCallback } from 'react';
import { DebounceInput } from 'react-debounce-input';
import { MdDelete } from 'react-icons/md';
import { ManagedCourse_Course_by_pk_CourseLocations } from '../../queries/__generated__/ManagedCourse';

interface IProps {
  location: ManagedCourse_Course_by_pk_CourseLocations | null;
  options: string[];
  onSetOption: (
    c: ManagedCourse_Course_by_pk_CourseLocations,
    p: string
  ) => any;
  onSetLink: (c: ManagedCourse_Course_by_pk_CourseLocations, l: string) => any;
  onDelete: (c: ManagedCourse_Course_by_pk_CourseLocations) => any;
}

export const LocationSelectionRow: FC<IProps> = ({
  location,
  options,
  onSetLink,
  onSetOption,
  onDelete,
}) => {
  const { t } = useTranslation();
  const handleSetOption = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      if (location != null) {
        onSetOption(location, event.target.value);
      }
    },
    [location, onSetOption]
  );

  const handleSetLink = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (location != null) {
        onSetLink(location, event.target.value);
      }
    },
    [location, onSetLink]
  );

  const handleDelete = useCallback(() => {
    if (location != null) {
      onDelete(location);
    }
  }, [location, onDelete]);

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-4 mr-3 ml-3">
        {!location && <p>{t('places')}</p>}
        {location && (
          <select
            onChange={handleSetOption}
            value={location.locationOption || 'ONLINE'}
            className="w-full h-10 bg-edu-light-gray"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="col-span-7 mr-3 ml-3">
        {!location && <div>{`${t('address')} / ${t('link')}`}</div>}
        {location && (
          <DebounceInput
            className="w-full h-10 bg-edu-light-gray"
            value={location.locationOption}
            onChange={handleSetLink}
            debounceTimeout={1000}
          />
        )}
      </div>
      <div className="mr-3 ml-3">
        {!location && <div>&nbsp;</div>}
        {location && (
          <div>
            <IconButton onClick={handleDelete}>
              <MdDelete size="0.75em" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
};
