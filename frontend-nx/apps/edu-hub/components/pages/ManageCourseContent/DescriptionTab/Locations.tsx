import { useTranslations } from 'next-intl';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
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
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';

interface LocationsIProps {
  location: ManagedCourse_Course_by_pk_CourseLocations | null;
  onDelete: (c: ManagedCourse_Course_by_pk_CourseLocations) => any;
}

export const Locations: FC<LocationsIProps> = ({ location, onDelete }) => {
  const t = useTranslations('manageCourse');
  const [showAddressLookupError, setShowAddressLookupError] = useState(true);

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

  const isOnline = location?.locationOption === 'ONLINE';

  // locationOption dependent placeholder (already translated)
  const address_placeholder = useMemo(
    () => (isOnline ? t('address.placeholder.online') : t('address.placeholder.offline')),
    [isOnline, t]
  );

  // Get the current defaultSessionAddressId if it exists
  const currentDefaultSessionAddressId = location?.defaultSessionAddressId || null;

  // Query location addresses for the selected location option (skip for ONLINE)
  const { data: addressData, error: addressDataError, loading: addressDataLoading } = useRoleQuery(
    LOCATION_ADDRESS_BY_LOCATION_OPTION,
    {
      variables: {
        locationOption: location?.locationOption ?? LocationOption_enum.ONLINE,
        searchFilter: '%',
      },
      skip: !location?.locationOption || isOnline,
    }
  );

  useEffect(() => {
    if (addressDataError) {
      setShowAddressLookupError(true);
    }
  }, [addressDataError]);

  const isAddressLookupUnavailable = addressDataLoading || !!addressDataError;

  // Transform addresses for dropdown options
  const addressOptions = useMemo(() => {
    if (!addressData?.LocationAddress) return [];

    return addressData.LocationAddress.map((addr: any) => ({
      label: addr.address ? `${addr.shortLabel} (${addr.address})` : addr.shortLabel,
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
            refetchQueries={['ManagedCourse', 'LocationAddressByLocationOption']}
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
              placeholder={address_placeholder}
              value={location?.defaultSessionAddress || ''}
              className="mb-5"
              showCharacterCount={false}
            />
          ) : (
            <DropDownSelector
              variant="eduhub"
              label=""
              placeholder={address_placeholder}
              helpText={address_placeholder}
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
              nullableLabel={t('SessionsTab.sessionAddresses.no_address_selected')}
              className="mb-2"
              disabled={isAddressLookupUnavailable}
            />
          )}
        </div>
      )}
      <div>{location && <DeleteButton handleDelete={handleDelete} />}</div>
      <ErrorMessageDialog
        errorMessage={addressDataError?.message || 'Failed to load location addresses.'}
        open={!!addressDataError && showAddressLookupError}
        onClose={() => setShowAddressLookupError(false)}
      />
    </div>
  );
};

export default Locations;
