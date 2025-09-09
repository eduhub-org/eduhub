import useTranslation from 'next-translate/useTranslation';
import { FC, useMemo } from 'react';
import { ManagedCourse_Course_by_pk_Sessions_SessionAddresses } from '../../../../queries/__generated__/ManagedCourse';
import { UPDATE_SESSION_ADDRESS } from '../../../../queries/course';
import { LOCATION_ADDRESS_BY_LOCATION_OPTION, CREATE_LOCATION_ADDRESS } from '../../../../queries/locationAddress';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import DropDownSelector from '../../../inputs/DropDownSelector';
import { isLinkFormat } from '../../../../helpers/util';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

interface SessionAddressesIProps {
  address: ManagedCourse_Course_by_pk_Sessions_SessionAddresses | null;
  refetchQueries: [string];
}

export const SessionAddresses: FC<SessionAddressesIProps> = ({ address, refetchQueries }) => {
  const { t } = useTranslation('course-page');

  const defaultSessionAddress = address?.CourseLocation?.defaultSessionAddress;
  const sessionAddress = address?.address || defaultSessionAddress;
  const isOnline = address?.CourseLocation?.locationOption === 'ONLINE';
  const isValidLink = isLinkFormat(sessionAddress);
  
  // Get the current locationAddressId if it exists
  const currentLocationAddressId = (address as any)?.locationAddressId || null;

  const label = isOnline
    ? t('sessionAddress.online.label')
    : t('common:location.' + address?.CourseLocation?.locationOption);

  // Query location addresses for the selected location option
  const { data: addressData } = useRoleQuery(LOCATION_ADDRESS_BY_LOCATION_OPTION, {
    variables: {
      locationOptionId: address?.CourseLocation?.locationOption as LocationOption_enum,
      searchFilter: '%',
    },
    skip: !address?.CourseLocation?.locationOption || isOnline,
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


  // For online sessions, show the link as read-only
  if (isOnline) {
    const value = isValidLink ? sessionAddress : t('sessionAddress.online.placeholder');
    return (
      <div className="mb-2 flex items-center">
        <span className="mr-4 min-w-0 flex-shrink-0">{label}:</span>
        <span className="text-gray-800 flex-1">{value}</span>
        <Tooltip title={t('sessionAddress.online.placeholder')} placement="top">
          <HelpOutline
            style={{
              cursor: 'pointer',
              color: '#666',
              marginLeft: '8px',
              fontSize: '20px',
            }}
          />
        </Tooltip>
      </div>
    );
  }

  // For offline sessions, use the enhanced dropdown selector
  return (
    <div className="mb-2 flex items-center">
      <span className="mr-8 min-w-0 flex-shrink-0">{label}:</span>
      <div className="flex-1 mb-2 min-w-0">
        <DropDownSelector
          variant="material"
          label=""
          placeholder={t('sessionAddress.offline.placeholder')}
          helpText={t('sessionAddress.offline.placeholder')}
          value={currentLocationAddressId?.toString() || ''}
          options={addressOptions}
          updateValueMutation={UPDATE_SESSION_ADDRESS}
          identifierVariables={{ 
            itemId: address?.id,
            locationOptionId: address?.CourseLocation?.locationOption 
          }}
          creatable={true}
          createOptionMutation={CREATE_LOCATION_ADDRESS}
          refetchQueries={[...refetchQueries, 'LocationAddressByLocationOption']}
          nullable={true}
          nullableLabel={t('sessionAddress.no_address_selected')}
        />
      </div>
    </div>
  );
};

export default SessionAddresses;
