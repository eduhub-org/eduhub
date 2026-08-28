import { QueryResult } from '@apollo/client';
import { FC, useMemo } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline } from '@mui/icons-material';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import {
  DELETE_COURSE_LOCATION,
  INSERT_COURSE_LOCATION,
  UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1,
  UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2,
  UPDATE_COURSE_END_TIME,
  UPDATE_COURSE_HEADING_DESCRIPTION_1,
  UPDATE_COURSE_HEADING_DESCRIPTION_2,
  UPDATE_COURSE_LANGUAGE,
  UPDATE_COURSE_MAX_PARTICIPANTS,
  UPDATE_COURSE_GUEST_REGISTRATION_ENABLED,
  UPDATE_COURSE_START_TIME,
  UPDATE_COURSE_WEEKDAY,
  UPDATE_COURSE_SHORT_DESCRIPTION,
  DELETE_SESSION_ADDRESSES_BY_COURSE_AND_LOCATION,
  INSERT_SESSION_ADDRESS,
} from '../../../../queries/course';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import Locations from './Locations';
import { Button } from '@mui/material';
import { MdAddCircle } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import DropDownSelector from '../../../inputs/DropDownSelector';
import CheckboxSelector from '../../../inputs/CheckboxSelector';
import TimePicker from '../../../inputs/TimePicker';
import { CourseRegistrationType_enum, LocationOption_enum } from '../../../../__generated__/globalTypes';
import { ProgramType } from '../../../../types/enums';
import useErrorHandler from '../../../../hooks/useErrorHandler';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import {
  DeleteCourseLocation,
  DeleteCourseLocationVariables,
} from '../../../../queries/__generated__/DeleteCourseLocation';
import {
  InsertCourseLocation,
  InsertCourseLocationVariables,
} from '../../../../queries/__generated__/InsertCourseLocation';
import {
  DeleteSessionAddressesByCourseAndLocation,
  DeleteSessionAddressesByCourseAndLocationVariables,
} from '../../../../queries/__generated__/DeleteSessionAddressesByCourseAndLocation';
import {
  InsertSessionAddress,
  InsertSessionAddressVariables,
} from '../../../../queries/__generated__/InsertSessionAddress';
import InputField from '../../../inputs/InputField';
import { Button as ChatLinkButton } from '../../../common/Button';
interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

export const DescriptionTab: FC<IProps> = ({ course, qResult }) => {
  const { error, handleError, resetError } = useErrorHandler();
  const t = useTranslations('manageCourse');
  const tCourse = useTranslations('course');

  const programInstructorRoomId = course.Program?.matrixInstructorRoomId?.trim();
  const elementBaseUrl = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL?.replace(/\/+$/, '');
  const programOrganizerChatLink = useMemo(() => {
    if (!programInstructorRoomId || !elementBaseUrl) return null;
    return `${elementBaseUrl}/#/room/${programInstructorRoomId}`;
  }, [programInstructorRoomId, elementBaseUrl]);

  const [insertCourseLocation] = useRoleMutation<InsertCourseLocation, InsertCourseLocationVariables>(
    INSERT_COURSE_LOCATION,
    {
      onError: (error) => handleError(error.message),
    }
  );

  const [insertSessionAddress] = useRoleMutation<InsertSessionAddress, InsertSessionAddressVariables>(
    INSERT_SESSION_ADDRESS,
    {
      onError: (error) => handleError(error.message),
    }
  );

  const handleInsertCourseLocation = async () => {
    try {
      const totalLocationOptions = Object.keys(LocationOption_enum).length;

      // Check if the current number of locations is less than the total available options
      if (course.CourseLocations.length >= totalLocationOptions) {
        handleError('All available location options have been used for this course.');
        return;
      }

      // Extract the currently used options
      const usedOptions = new Set(course.CourseLocations.map((loc) => loc.locationOption));
      // Find the first available option
      const availableOption = Object.values(LocationOption_enum).find((option) => !usedOptions.has(option));

      // If there's no available option, this shouldn't happen due to the previous check, but let's keep it as a safeguard
      if (!availableOption) {
        handleError('All location options already exist for this course.');
        return;
      }

      // If there's is an available option, proceed with insertion
      const res = await insertCourseLocation({ variables: { courseId: course.id, option: availableOption } });
      //extract the location id from the response
      const insertedLocationId = res?.data?.insert_CourseLocation?.returning[0]?.id;
      if (insertedLocationId == null) {
        throw new Error('Failed to get inserted location ID');
      }
      // loop through the session addresses and add the new location
      await Promise.all(
        course.Sessions.map((session) => {
          return insertSessionAddress({
            variables: {
              sessionId: session.id,
              address: '',
              courseLocationId: insertedLocationId,
            },
          });
        })
      );
      qResult.refetch();
    } catch (error) {
      // Handle errors if any step in the try block fails
      handleError(error instanceof Error ? error.message : String(error));
      // Optionally, re-throw the error if you want calling functions to be able to handle it as well
      throw error;
    }
  };

  // define a new function deleteCourseLocation that used the DELETE_COURSE location mutation with useRoleMutation
  const [deleteCourseLocation] = useRoleMutation<DeleteCourseLocation, DeleteCourseLocationVariables>(
    DELETE_COURSE_LOCATION,
    {
      onError: (error) => handleError(error.message),
    }
  );
  const [DeleteSessionAddressesByCourseAndLocation] = useRoleMutation<
    DeleteSessionAddressesByCourseAndLocation,
    DeleteSessionAddressesByCourseAndLocationVariables
  >(DELETE_SESSION_ADDRESSES_BY_COURSE_AND_LOCATION, {
    onError: (error) => handleError(error.message),
  });

  const handleDeleteCourseLocation = async (location: { id: number }) => {
    // Check the number of course locations
    if (course.CourseLocations.length <= 1) {
      // Handle the case where the location is the last one (e.g., show an error message)
      handleError('A course needs at least one location.');
      return; // Exit the function early
    }
    // If there's more than one location, proceed with deletion
    await deleteCourseLocation({ variables: { locationId: location.id } }); // Call the function directly
    await DeleteSessionAddressesByCourseAndLocation({
      variables: { courseId: course.id, courseLocationId: location.id },
    }); // Call the function directly
    qResult.refetch(); // Refetch the query to update the UI
  };

  const weekDayOptions = [
    { value: 'NONE', label: t('weekdays.NONE') },
    { value: 'MONDAY', label: t('weekdays.MONDAY') },
    { value: 'TUESDAY', label: t('weekdays.TUESDAY') },
    { value: 'WEDNESDAY', label: t('weekdays.WEDNESDAY') },
    { value: 'THURSDAY', label: t('weekdays.THURSDAY') },
    { value: 'FRIDAY', label: t('weekdays.FRIDAY') },
    { value: 'SATURDAY', label: t('weekdays.SATURDAY') },
    { value: 'SUNDAY', label: t('weekdays.SUNDAY') },
  ];
  const languageOptions = [
    { value: 'DE', label: t('languages.DE') },
    { value: 'EN', label: t('languages.EN') },
  ];

  // Mirrors the guards in functions/callNodeFunction/registerGuestForCourse.
  const supportsGuestRegistration =
    course.Program?.type === ProgramType.EVENTS &&
    (course.registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION ||
      course.registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT);

  const courseLocations = [...course.CourseLocations];
  courseLocations.sort((a, b) => a.id - b.id);

  return (
    <div>
      {programOrganizerChatLink ? (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-lg border border-border-primary bg-bg-secondary p-4">
          <p className="text-sm text-label-primary">{t('element_program_instructor_chat_prompt')}</p>
          <ChatLinkButton
            className="!bg-brand !text-white !border-brand hover:!bg-brand-light hover:!border-brand-light whitespace-nowrap"
            as="a"
            href={programOrganizerChatLink}
            filled
          >
            {tCourse('general.to_course_chat')}
          </ChatLinkButton>
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2">
        <InputField
          variant="eduhub"
          type="textarea"
          value={course.tagline}
          label={t('short_description.label')}
          updateValueMutation={UPDATE_COURSE_SHORT_DESCRIPTION}
          refetchQueries={['ManagedCourse']}
          itemId={course.id}
          placeholder={t('short_description.placeholder')}
          helpText={t('short_description.help_text')}
          className="h-64"
          maxLength={500}
        />
        <div className="mx-4 mb-4">
          <div className="flex items-center mb-2">
            <Tooltip title={t('learning_goals.help_text')} placement="top">
              <HelpOutline className="text-label-primary cursor-pointer mr-1" />
            </Tooltip>
            <h3 className="text-label-primary text-md">{t('learning_goals.label')}</h3>
          </div>
          <div className="p-4 h-64 overflow-y-auto text-white">
            {course.learningGoals ? (
              <ul className="list-none">
                {course.learningGoals
                  .split('\n')
                  .filter((goal) => goal.trim() !== '')
                  .map((goal) => {
                    const goalKey = goal.trim().substring(0, 50).replace(/\s+/g, '-');
                    return (
                      <li key={goalKey} className="pl-6 mb-6">
                        <div className="flex">
                          <img src="/images/course/checkmark.svg" alt="check mark" className="mr-2 inline-block" />
                          <div className="ml-2">
                            {goal.split('\n').map((line) => {
                              const lineKey = `${goalKey}-${line.trim().substring(0, 20).replace(/\s+/g, '-')}`;
                              return (
                                <span key={lineKey}>
                                  {line}
                                  <br />
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <p className="text-gray-400 italic">{t('learning_goals.read_only_placeholder')}</p>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="min-h-0">
          <InputField
            variant="eduhub"
            type="input"
            value={course.headingDescriptionField1 ?? ''}
            itemId={course.id}
            updateValueMutation={UPDATE_COURSE_HEADING_DESCRIPTION_1}
            refetchQueries={['ManagedCourse']}
            label={t('info_block_1_title.label')}
            placeholder={t('info_block_1_title.placeholder')}
            helpText={t('info_block_1_title.help_text')}
            className="mb-0"
          />
          <InputField
            variant="eduhub"
            type="markdown"
            value={course.contentDescriptionField1 ?? ''}
            itemId={course.id}
            updateValueMutation={UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1}
            refetchQueries={['ManagedCourse']}
            placeholder={t('info_block_1_content.placeholder')}
            maxLength={10000}
            className="h-64"
          />
        </div>
        <div className="min-h-0">
          <InputField
            variant="eduhub"
            type="input"
            value={course.headingDescriptionField2 ?? ''}
            itemId={course.id}
            updateValueMutation={UPDATE_COURSE_HEADING_DESCRIPTION_2}
            refetchQueries={['ManagedCourse']}
            label={t('info_block_2_title.label')}
            helpText={t('info_block_2_title.help_text')}
            placeholder={t('info_block_2_title.placeholder')}
            className="mb-0"
          />
          <InputField
            variant="eduhub"
            type="markdown"
            value={course.contentDescriptionField2 ?? ''}
            itemId={course.id}
            updateValueMutation={UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2}
            refetchQueries={['ManagedCourse']}
            placeholder={t('info_block_2_content.placeholder')}
            maxLength={10000}
            className="h-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="grid grid-cols-3">
          <DropDownSelector
            variant="eduhub"
            label={t('weekday')}
            value={course.weekDay ?? 'MONDAY'}
            options={weekDayOptions}
            updateValueMutation={UPDATE_COURSE_WEEKDAY}
            identifierVariables={{ courseId: course.id }}
            refetchQueries={['ManagedCourse']}
          />
          <TimePicker
            variant="eduhub"
            label={t('start_time')}
            currentValue={course.startTime}
            updateValueMutation={UPDATE_COURSE_START_TIME}
            identifierVariables={{ courseId: course.id }}
            refetchQueries={['ManagedCourse']}
            className="mb-4"
          />
          <TimePicker
            variant="eduhub"
            label={t('end_time')}
            currentValue={course.endTime}
            updateValueMutation={UPDATE_COURSE_END_TIME}
            identifierVariables={{ courseId: course.id }}
            refetchQueries={['ManagedCourse']}
            className="mb-4"
          />
          <div />
        </div>
        <div className="grid grid-cols-2">
          <DropDownSelector
            variant="eduhub"
            label={t('language')}
            options={languageOptions}
            value={course.language ?? ''}
            updateValueMutation={UPDATE_COURSE_LANGUAGE}
            identifierVariables={{ courseId: course.id }}
            refetchQueries={['ManagedCourse']}
          />
          <div>
            <InputField
              variant="eduhub"
              type="number"
              label={t('max_participants.label')}
              value={course.maxParticipants?.toString() || '0'}
              itemId={course.id}
              updateValueMutation={UPDATE_COURSE_MAX_PARTICIPANTS}
              refetchQueries={['ManagedCourse']}
              min={0}
              onValueUpdated={() => qResult.refetch()}
              placeholder={t('max_participants.placeholder')}
              helpText={t('max_participants.help_text')}
            />
          </div>
        </div>
        {/* Only meaningful for standalone events registered directly - the
            backend rejects guest registration for anything else, so showing the
            toggle elsewhere would just promise something that cannot work. */}
        {supportsGuestRegistration && (
          <div className="grid grid-cols-2">
            <CheckboxSelector
              variant="eduhub"
              label={t('guest_registration.label')}
              helpText={t('guest_registration.help_text')}
              checked={Boolean(course.guestRegistrationEnabled)}
              updateValueMutation={UPDATE_COURSE_GUEST_REGISTRATION_ENABLED}
              identifierVariables={{ courseId: course.id }}
              refetchQueries={['ManagedCourse']}
            />
            <div />
          </div>
        )}
      </div>

      <div>
        <div className="grid grid-cols-12 text-label-primary px-2">
          <div className="col-span-2">{t('location.label')}</div>
          <div className="col-span-7">{t('address.label')}</div>
        </div>
        {courseLocations.map((loc) => (
          <Locations key={loc.id} location={loc} onDelete={handleDeleteCourseLocation} />
        ))}
      </div>
      <div className="flex justify-start text-white">
        <Button onClick={handleInsertCourseLocation} startIcon={<MdAddCircle />} color="inherit">
          {t('add_new_location')}
        </Button>
      </div>
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};
