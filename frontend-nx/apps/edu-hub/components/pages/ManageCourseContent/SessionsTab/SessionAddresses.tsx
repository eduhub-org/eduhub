import useTranslation from 'next-translate/useTranslation';
import { ChangeEvent, FC, useCallback } from 'react';
import {
  ManagedCourse_Course_by_pk_CourseLocations,
  ManagedCourse_Course_by_pk_Sessions_SessionAddresses,
} from '../../../../queries/__generated__/ManagedCourse';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { LocationOptions } from '../../../../queries/__generated__/LocationOptions';
import { LOCATION_OPTIONS, UPDATE_SESSION_ADDRESS } from '../../../../queries/course';
import EduHubTextFieldEditor from '../../../forms/EduHubTextFieldEditor';
import { isLinkFormat } from '../../../../helpers/util';

interface SessionAddressesIProps {
  address: ManagedCourse_Course_by_pk_Sessions_SessionAddresses | null;
  courseLocations: ManagedCourse_Course_by_pk_CourseLocations[];
}

export const SessionAddresses: FC<SessionAddressesIProps> = ({ address, courseLocations }) => {
  const { t } = useTranslation('course-page');

  // select the default session address from the course location where location is equal to address.location
  const location = courseLocations?.find((location) => location.locationOption === address?.location);

  const defaultSessionAddress = location ? location.defaultSessionAddress : undefined;
  const isOnline = address?.location === 'ONLINE';
  const isValidLink = isLinkFormat(defaultSessionAddress);

  const label = isOnline
    ? t('sessionAddress.online.label')
    : t('sessionAddress.offline.label') + t('common:location.' + address?.location);
  const value = isOnline
    ? isValidLink
      ? defaultSessionAddress
      : t('sessionAddress.online.placeholder')
    : defaultSessionAddress;
  const placeholder = isOnline ? null : t('sessionAddress.offline.placeholder');

  return (
    <>
      <div>{label}:</div>
      <div>
        {isOnline ? (
          <div>{value}</div>
        ) : (
          <EduHubTextFieldEditor
            element="input"
            updateMutation={UPDATE_SESSION_ADDRESS}
            itemId={address.id}
            placeholder={placeholder}
            value={value}
            className="h-2 mb-0"
            showCharacterCount={false}
            invertColors={true}
          />
        )}
      </div>
    </>
  );
};

export default SessionAddresses;
