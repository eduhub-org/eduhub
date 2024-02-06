import { IconButton } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { ChangeEvent, FC, useCallback } from 'react';
import { MdDelete } from 'react-icons/md';
import { ManagedCourse_Course_by_pk_CourseLocations } from '../../../../queries/__generated__/ManagedCourse';
import EduHubDropdownSelector from '../../../forms/EduHubDropdownSelector';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { LocationOptionsKnown } from 'apps/edu-hub/queries/__generated__/LocationOptionsKnown';
import { LOCATION_OPTIONS } from '../../../../queries/course';
import EduHubTextFieldEditor from '../../../forms/EduHubTextFieldEditor';
import { isLinkFormat } from '../../../../helpers/util';

interface LocationsIProps {
  location: ManagedCourse_Course_by_pk_CourseLocations | null;
  onSetOption: (c: ManagedCourse_Course_by_pk_CourseLocations, p: string) => any;
  onSetLink: (c: ManagedCourse_Course_by_pk_CourseLocations, l: string) => any;
  onDelete: (c: ManagedCourse_Course_by_pk_CourseLocations) => any;
}

export const Locations: FC<LocationsIProps> = ({ location, onSetLink, onSetOption, onDelete }) => {
  const { t } = useTranslation('course-page');

  const queryKnownLocationOptions = useRoleQuery<LocationOptionsKnown>(LOCATION_OPTIONS);
  if (queryKnownLocationOptions.error) {
    console.log('query known location options error', queryKnownLocationOptions.error);
  }
  const locationOptions = (queryKnownLocationOptions.data?.LocationOption || []).map((x) => x.value);
  const locations = locationOptions.map((location) => ({ value: location, label: location }));

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

  // locationOption dependent placeholder
  const address_placeholder =
    location?.locationOption === 'ONLINE' ? 'address.placeholder.online' : 'address.placeholder.offline';
  // locationOption dependent typeCheck
  const typeCheckFunction = location?.locationOption === 'ONLINE' ? isLinkFormat : undefined;

  return (
    <div className="grid grid-cols-12 items-center">
      {location && (
        <div className="col-span-2">
          <EduHubDropdownSelector
            options={locations}
            value={location.locationOption || 'ONLINE'}
            onChange={handleSetOption}
            className="mb-0"
          />
        </div>
      )}
      <div className="col-span-7">
        <EduHubTextFieldEditor
          element="input"
          placeholder={t(address_placeholder)}
          value={location?.defaultSessionAddress || ''}
          onChange={handleSetLink}
          typeCheck={typeCheckFunction}
          errorText={t('address.error')}
          className="mb-0"
        />
      </div>
      <div>
        {location && (
          <div>
            <IconButton onClick={handleDelete}>
              <MdDelete size="0.75em" className="text-red-500" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Locations;
