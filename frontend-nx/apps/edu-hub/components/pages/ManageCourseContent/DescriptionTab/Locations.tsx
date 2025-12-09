import { QueryResult } from '@apollo/client';
import { useTranslations, useLocale } from 'next-intl';
import { FC, useCallback, useMemo } from 'react';
import { ManagedCourse_Course_by_pk_CourseLocations } from '../../../../queries/__generated__/ManagedCourse';
import DropDownSelector from '../../../inputs/DropDownSelector';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { LocationOptions } from '../../../../queries/__generated__/LocationOptions';
import {
  LOCATION_OPTIONS,
  UPDATE_COURSE_LOCATION,
  UPDATE_COURSE_SESSION_DEFAULT_ADDRESS,
  UPDATE_COURSE_DEFAULT_SESSION_ADDRESS_ID,
} from '../../../../queries/course';
import { LOCATION_ADDRESS_BY_LOCATION_OPTION, CREATE_LOCATION_ADDRESS } from '../../../../queries/locationAddress';
import InputField from '../../../inputs/InputField';
import DeleteButton from '../../../../components/common/DeleteButton';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';

interface LocationsIProps {
  location: ManagedCourse_Course_by_pk_CourseLocations | null;
  onDelete: (c: ManagedCourse_Course_by_pk_CourseLocations) => any;
  refetchQuery: QueryResult<any, any>;
}

export const Locations: FC<LocationsIProps> = ({ location, onDelete }) => {
  const t = useTranslations('coursePage');

  const queryLocationOptions = useRoleQuery<LocationOptions>(LOCATION_OPTIONS);
  if (queryLocationOptions.error) {
    console.log('query known location options error', queryLocationOptions.error);
  }
  const locationOptions = (queryLocationOptions.data?.LocationOption || []).map((x) => ({
    value: x.value,
    label: t(`location.${x.value}`),
  }));

  const handleDelete = useCallback(() => {
    if (location != null) {
      onDelete(location);
    }
  }, [location, onDelete]);

  // locationOption dependent placeholder
  const address_placeholder =
    location?.locationOption === 'ONLINE' ? 'address.placeholder.online' : 'address.placeholder.offline';

  const isOnline = location?.locationOption === 'ONLINE';

  // Get the current defaultSessionAddressId if it exists
  const currentDefaultSessionAddressId = (location as any)?.defaultSessionAddressId || null;

  // Query location addresses for the selected location option (skip for ONLINE)
  const { data: addressData } = useRoleQuery(LOCATION_ADDRESS_BY_LOCATION_OPTION, {
    variables: {
      locationOption: location?.locationOption as LocationOption_enum,
      searchFilter: '%',
    },
    skip: !location?.locationOption || isOnline,
  });

  // Transform addresses for dropdown options
  const addressOptions = useMemo(() => {
    if (!addressData?.LocationAddress) return [];
    
    return addressData.LocationAddress.map((addr: any) => ({
      label: addr.shortLabel,
      value: addr.id.toString(),
      aliases: addr.aliases || [],
    }));
  }, [addressData]);

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
            className="mb-2"
          />
        </div>
      )}
      {location && (
        <div className="col-span-7">
          {isOnline ? (
            <InputField
              variant="eduhub"
              type="link"
              updateValueMutation={UPDATE_COURSE_SESSION_DEFAULT_ADDRESS}
              refetchQueries={['ManagedCourse']}
              itemId={location.id}
              placeholder={t(address_placeholder)}
              value={location?.defaultSessionAddress || ''}
              className="mb-5"
              showCharacterCount={false}
            />
          ) : (
            <DropDownSelector
              variant="eduhub"
              label=""
              placeholder={t(address_placeholder)}
              helpText={t(address_placeholder)}
              value={currentDefaultSessionAddressId?.toString() || ''}
              options={addressOptions}
              updateValueMutation={UPDATE_COURSE_DEFAULT_SESSION_ADDRESS_ID}
              identifierVariables={{ 
                itemId: location.id,
                locationOption: location?.locationOption 
              }}
              creatable={true}
              createOptionMutation={CREATE_LOCATION_ADDRESS}
              refetchQueries={['ManagedCourse', 'LocationAddressByLocationOption']}
              nullable={true}
              nullableLabel={t('sessionAddress.no_address_selected')}
              className="mb-2"
            />
          )}
        </div>
      )}
      <div>{location && <DeleteButton handleDelete={handleDelete} />}</div>
    </div>
  );
};

export default Locations;
