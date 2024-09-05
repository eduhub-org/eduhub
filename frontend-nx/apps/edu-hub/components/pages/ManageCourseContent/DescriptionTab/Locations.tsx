import { QueryResult } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback } from 'react';
import { ManagedCourse_Course_by_pk_CourseLocations } from '../../../../queries/__generated__/ManagedCourse';
import EduHubDropdownSelector from '../../../forms/EduHubDropdownSelector';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { LocationOptions } from '../../../../queries/__generated__/LocationOptions';
import {
  LOCATION_OPTIONS,
  UPDATE_COURSE_LOCATION,
  UPDATE_COURSE_SESSION_DEFAULT_ADDRESS,
} from '../../../../queries/course';
import EduHubTextFieldEditor from '../../../forms/EduHubTextFieldEditor';
import { isLinkFormat } from '../../../../helpers/util';
import DeleteButton from '../../../../components/common/DeleteButton';

interface LocationsIProps {
  location: ManagedCourse_Course_by_pk_CourseLocations | null;
  onDelete: (c: ManagedCourse_Course_by_pk_CourseLocations) => any;
  refetchQuery: QueryResult<any, any>;
}

export const Locations: FC<LocationsIProps> = ({ location, onDelete, refetchQuery }) => {
  const { t } = useTranslation('course-page');

  const queryLocationOptions = useRoleQuery<LocationOptions>(LOCATION_OPTIONS);
  if (queryLocationOptions.error) {
    console.log('query known location options error', queryLocationOptions.error);
  }
  const locationOptions = (queryLocationOptions.data?.LocationOption || []).map((x) => x.value);

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
            updateMutation={UPDATE_COURSE_LOCATION}
            idVariables={{ locationId: location.id }}
            refetchQueries={['ManagedCourse']}
            translationPrefix="course-page:location."
            className="mb-2"
          />
        </div>
      )}
      <div className="col-span-7">
        <EduHubTextFieldEditor
          element="input"
          updateMutation={UPDATE_COURSE_SESSION_DEFAULT_ADDRESS}
          refetchQuery={refetchQuery}
          itemId={location.id}
          placeholder={t(address_placeholder)}
          value={location?.defaultSessionAddress || ''}
          typeCheck={typeCheckFunction}
          errorText={t('address.errorText')}
          className="mb-2"
        />
      </div>
      <div>{location && <DeleteButton handleDelete={handleDelete} />}</div>
    </div>
  );
};

export default Locations;
