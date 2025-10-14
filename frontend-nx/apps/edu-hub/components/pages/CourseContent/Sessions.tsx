import { FC, useMemo, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

import { Course_Course_by_pk_Sessions as Session, Course_Course_by_pk_CourseLocations as CourseLocation } from '../../../queries/__generated__/Course';
import UserCard from '../../common/UserCard';
import { useDisplayDate, useFormatTimeString } from '../../../helpers/dateTimeHelpers';
import { isLinkFormat } from '../../../helpers/util';
import { useIsAdmin, useIsInstructor } from '../../../hooks/authentication';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { LOCATION_ADDRESSES_BY_IDS } from '../../../queries/locationAddress';

interface SessionsProps {
  sessions: Session[];
  courseLocations: CourseLocation[];
  isLoggedInParticipant: boolean;
}

export const Sessions: FC<SessionsProps> = ({ sessions, courseLocations, isLoggedInParticipant }) => {
  const { t } = useTranslation('course');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();

  const initiallyShownSessions = 4;

  const visibleSessions = useMemo(() => {
    return showAllSessions ? sessions : sessions.slice(0, initiallyShownSessions);
  }, [showAllSessions, sessions, initiallyShownSessions]);

  // Collect all location address IDs from sessions
  const addressIds = useMemo(() => {
    const ids = new Set<number>();
    sessions.forEach((session) => {
      session.SessionAddresses.forEach((sessionAddress) => {
        const locationAddressId = (sessionAddress as any).locationAddressId;
        const defaultSessionAddressId = (sessionAddress.CourseLocation as any)?.defaultSessionAddressId;
        
        if (locationAddressId) ids.add(locationAddressId);
        if (defaultSessionAddressId) ids.add(defaultSessionAddressId);
      });
    });
    return Array.from(ids);
  }, [sessions]);

  // Query location addresses for all IDs
  const { data: addressData } = useRoleQuery(LOCATION_ADDRESSES_BY_IDS, {
    variables: { ids: addressIds },
    skip: addressIds.length === 0,
  });

  // Create a lookup map for addresses by ID
  const addressMap = useMemo(() => {
    if (!addressData?.LocationAddress) return new Map();
    const map = new Map();
    addressData.LocationAddress.forEach((addr: any) => {
      map.set(addr.id, addr);
    });
    return map;
  }, [addressData]);


  return (
    <>
      {visibleSessions.length > 0 && (
        <>
          <span className="text-3xl font-semibold mt-24">{t('sessions.course_sessions')}</span>
          <ul className="max-w-2xl">
            {visibleSessions.map(({ startDateTime, endDateTime, title, SessionSpeakers, SessionAddresses }, index) => (
              <li key={index} className="flex mb-4">
                <div className="flex flex-wrap items-start flex-shrink-0 mb-2">
                  <div className="flex flex-col mr-6">
                    <span className="block text-sm sm:text-lg font-semibold">{displayDate(startDateTime)}</span>
                    <span className="text-sm whitespace-nowrap">
                      {formatTimeString(startDateTime)}
                      {' - '}
                      {formatTimeString(endDateTime)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="block text-sm sm:text-lg break-words">{title}</span>
                  <div className="break-words">
                    {/* Sort SessionAddresses by CourseLocations order */}
                    {courseLocations.map((courseLocation, addressIndex) => {
                      // Find the SessionAddress for this CourseLocation
                      const sessionAddress = SessionAddresses.find(
                        (sa) => sa.CourseLocation?.id === courseLocation.id
                      );
                      
                      // Skip if no SessionAddress exists for this CourseLocation
                      if (!sessionAddress) return null;
                      const { address, CourseLocation } = sessionAddress;
                      const locationAddressId = (sessionAddress as any).locationAddressId;
                      const defaultSessionAddressId = (CourseLocation as any)?.defaultSessionAddressId;


                      // Get the address to display using the new ID-based system
                      let displayAddress = '';
                      let addressLocation = null;
                      
                      // First try to use locationAddressId, then fall back to defaultSessionAddressId
                      const effectiveAddressId = locationAddressId || defaultSessionAddressId;
                      
                      if (effectiveAddressId && addressMap.has(effectiveAddressId)) {
                        addressLocation = addressMap.get(effectiveAddressId);
                        displayAddress = addressLocation.address;
                      } else {
                        // Fallback to legacy text fields if IDs aren't available
                        displayAddress = address && address.trim() !== '' ? address : CourseLocation?.defaultSessionAddress || '';
                      }

                      return (
                        <span key={courseLocation.id} className="text-sm text-gray-400 ml-0 pl-0">
                          {CourseLocation ? (
                            CourseLocation.locationOption === 'ONLINE' ? (
                              <>
                                {isLoggedInParticipant || isAdmin || isInstructor ? (
                                  isLinkFormat(displayAddress) ? (
                                    <a
                                      href={displayAddress}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline"
                                    >
                                      ONLINE
                                    </a>
                                  ) : (
                                    <>ONLINE {t('general.link_will_be_provided_soon')}</>
                                  )
                                ) : (
                                  'ONLINE'
                                )}
                              </>
                            ) : displayAddress ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  displayAddress
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {displayAddress}
                              </a>
                            ) : (
                              <>
                                {CourseLocation?.locationOption} {t('general.address_will_be_provided_soon')}
                              </>
                            )
                          ) : (
                            'Location not available'
                          )}
                          {/* Add separator if this is not the last location with a SessionAddress */}
                          {addressIndex < courseLocations.filter(cl => 
                            SessionAddresses.some(sa => sa.CourseLocation?.id === cl.id)
                          ).length - 1 && ' +\u00A0'}
                        </span>
                      );
                    }).filter(Boolean)}
                  </div>
                  <div className="flex flex-col">
                    {SessionSpeakers &&
                      SessionSpeakers.map((speaker, speakerIndex) => (
                        <UserCard
                          key={speakerIndex}
                          className="flex items-center my-3"
                          user={speaker.Expert.User}
                          role={t('general.speaker')}
                          size="medium"
                        />
                      ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {sessions.length > initiallyShownSessions &&
            (showAllSessions ? (
              <button
                className="text-white text-sm sm:text-lg font-semibold hover:underline italic flex items-center pb-6"
                onClick={() => setShowAllSessions(false)}
              >
                {t('sessions.hide_sessions')}
                <IoIosArrowUp className="ml-1" />
              </button>
            ) : (
              <button
                className="text-white text-sm sm:text-lg font-semibold hover:underline italic flex items-center pb-6"
                onClick={() => setShowAllSessions(true)}
              >
                {t('sessions.show_all_sessions')}
                <IoIosArrowDown className="ml-1" />
              </button>
            ))}
        </>
      )}
    </>
  );
};
