import useTranslation from 'next-translate/useTranslation';
import { ChangeEvent, FC, useCallback } from 'react';
import { ManagedCourse_Course_by_pk_CourseLocations } from '../../../../queries/__generated__/ManagedCourse';
import EduHubDropdownSelector from '../../../forms/EduHubDropdownSelector';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { LocationOptions } from '../../../../queries/__generated__/LocationOptions';
import { LOCATION_OPTIONS, UPDATE_COURSE_SESSION_DEFAULT_ADDRESS } from '../../../../queries/course';
import EduHubTextFieldEditor from '../../../forms/EduHubTextFieldEditor';
import { isLinkFormat } from '../../../../helpers/util';
import DeleteButton from '../../../../components/common/DeleteButton';

interface LocationsIProps {
  location: ManagedCourse_Course_by_pk_CourseLocations | null;
  onSetOption: (c: ManagedCourse_Course_by_pk_CourseLocations, p: string) => any;
  onDelete: (c: ManagedCourse_Course_by_pk_CourseLocations) => any;
}

export const Locations: FC<LocationsIProps> = ({ location, onSetOption, onDelete }) => {
  const { t } = useTranslation('course-page');

  const queryLocationOptions = useRoleQuery<LocationOptions>(LOCATION_OPTIONS);
  if (queryLocationOptions.error) {
    console.log('query known location options error', queryLocationOptions.error);
  }
  const locationOptions = (queryLocationOptions.data?.LocationOption || []).map((x) => x.value);
  const locations = locationOptions.map((location) => ({ value: location, label: location }));

  const handleSetOption = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      if (location != null) {
        onSetOption(location, event.target.value);
      }
    },
    [location, onSetOption]
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
            options={locationOptions}
            value={location.locationOption || 'ONLINE'}
            onChange={handleSetOption}
            className="mb-0"
            translationPrefix="common:location."
          />
        </div>
      )}
      <div className="col-span-7">
        <EduHubTextFieldEditor
          element="input"
          updateMutation={UPDATE_COURSE_SESSION_DEFAULT_ADDRESS}
          itemId={location.id}
          placeholder={t(address_placeholder)}
          value={location?.defaultSessionAddress || ''}
          typeCheck={typeCheckFunction}
          errorText={t('address.errorText')}
          className="mb-0"
        />
      </div>
      <div>{location && <DeleteButton handleDelete={handleDelete} />}</div>
    </div>
  );
};

export default Locations;
