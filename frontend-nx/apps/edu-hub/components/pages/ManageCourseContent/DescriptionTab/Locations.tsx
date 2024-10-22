import { QueryResult } from '@apollo/client';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback } from 'react';
import { ManagedCourse_Course_by_pk_CourseLocations } from '../../../../queries/__generated__/ManagedCourse';
import DropDownSelector from '../../../forms/DropDownSelector';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { LocationOptions } from '../../../../queries/__generated__/LocationOptions';
import {
  LOCATION_OPTIONS,
  UPDATE_COURSE_LOCATION,
  UPDATE_COURSE_SESSION_DEFAULT_ADDRESS,
} from '../../../../queries/course';
import InputField from '../../../forms/InputField';
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
          <DropDownSelector
            variant="eduhub"
            options={locationOptions}
            value={location.locationOption || 'ONLINE'}
            updateValueMutation={UPDATE_COURSE_LOCATION}
            identifierVariables={{ locationId: location.id }}
            refetchQueries={['ManagedCourse']}
            optionsTranslationPrefix="course-page:location."
            className="mb-2"
          />
        </div>
      )}
      <div className="col-span-7">
        <InputField
          variant="eduhub"
          type={location?.locationOption === 'ONLINE' ? 'link' : 'input'}
          updateValueMutation={UPDATE_COURSE_SESSION_DEFAULT_ADDRESS}
          refetchQueries={['ManagedCourse']}
          itemId={location.id}
          placeholder={t(address_placeholder)}
          value={location?.defaultSessionAddress || ''}
          className="mb-2"
          showCharacterCount={false}
        />
      </div>
      <div>{location && <DeleteButton handleDelete={handleDelete} />}</div>
    </div>
  );
};

export default Locations;
