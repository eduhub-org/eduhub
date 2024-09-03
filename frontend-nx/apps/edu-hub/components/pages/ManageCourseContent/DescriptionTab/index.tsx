import { QueryResult } from '@apollo/client';
import { FC } from 'react';
import { eventTargetNumberMapper, useRoleMutation, useUpdateCallback } from '../../../../hooks/authedMutation';
import {
  DELETE_COURSE_LOCATION,
  INSERT_COURSE_LOCATION,
  UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1,
  UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2,
  UPDATE_COURSE_END_TIME,
  UPDATE_COURSE_HEADING_DESCRIPTION_1,
  UPDATE_COURSE_HEADING_DESCRIPTION_2,
  UPDATE_COURSE_LANGUAGE,
  UPDATE_COURSE_LEARNING_GOALS,
  UPDATE_COURSE_LOCATION,
  UPDATE_COURSE_MAX_PARTICIPANTS,
  UPDATE_COURSE_START_TIME,
  UPDATE_COURSE_WEEKDAY,
  UPDATE_COURSE_SHORT_DESCRIPTION,
  DELETE_SESSION_ADDRESSES_BY_COURSE_AND_LOCATION,
  INSERT_SESSION_ADDRESS,
} from '../../../../queries/course';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import Locations from './Locations';
import { Button } from '@material-ui/core';
import { MdAddCircle } from 'react-icons/md';
import useTranslation from 'next-translate/useTranslation';
import EduHubTextFieldEditor from '../../../forms/EduHubTextFieldEditor';
import EduHubDropdownSelector from '../../../forms/EduHubDropdownSelector';
import EduHubTimePicker from '../../../forms/EduHubTimePicker';
import EduHubNumberFieldEditor from '../../../forms/EduHubNumberFieldEditor';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import useErrorHandler from '../../../../hooks/useErrorHandler';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import { useStartTimeString, useEndTimeString } from '../../../../helpers/dateTimeHelpers';
import {
  DeleteCourseLocation,
  DeleteCourseLocationVariables,
} from '../../../../queries/__generated__/DeleteCourseLocation';
import {
  InsertCourseLocation,
  InsertCourseLocationVariables,
} from '../../../../queries/__generated__/InsertCourseLocation';
import {
  UpdateCourseEndTime,
  UpdateCourseEndTimeVariables,
} from '../../../../queries/__generated__/UpdateCourseEndTime';
import {
  UpdateCourseLocation,
  UpdateCourseLocationVariables,
} from '../../../../queries/__generated__/UpdateCourseLocation';
import {
  UpdateCourseStartTime,
  UpdateCourseStartTimeVariables,
} from '../../../../queries/__generated__/UpdateCourseStartTime';
import {
  UpdateCourseMaxParticipants,
  UpdateCourseMaxParticipantsVariables,
} from '../../../../queries/__generated__/UpdateCourseMaxParticipants';
import {
  DeleteSessionAddressesByCourseAndLocation,
  DeleteSessionAddressesByCourseAndLocationVariables,
} from '../../../../queries/__generated__/DeleteSessionAddressesByCourseAndLocation';
import {
  InsertSessionAddress,
  InsertSessionAddressVariables,
} from '../../../../queries/__generated__/InsertSessionAddress';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

export const DescriptionTab: FC<IProps> = ({ course, qResult }) => {
  const { error, handleError, resetError } = useErrorHandler();
  const { t } = useTranslation('course-page');
  const getStartTimeString = useStartTimeString();
  const getEndTimeString = useEndTimeString();

  const [insertCourseLocation] = useRoleMutation<InsertCourseLocation, InsertCourseLocationVariables>(
    INSERT_COURSE_LOCATION,
    {
      onError: (error) => handleError(t(error.message)),
    }
  );

  const [insertSessionAddress] = useRoleMutation<InsertSessionAddress, InsertSessionAddressVariables>(
    INSERT_SESSION_ADDRESS,
    {
      onError: (error) => handleError(t(error.message)),
    }
  );

  const handleInsertCourseLocation = async () => {
    try {
      // Extract the currently used options
      const usedOptions = new Set(course.CourseLocations.map((loc) => loc.locationOption));
      // Find the first available option
      const availableOption = Object.values(LocationOption_enum).find((option) => !usedOptions.has(option));
      // If there's no available option, throw an error
      if (!availableOption) {
        handleError('All location options already exist for this course.');
        return; // Exit the function early
      }
      // If there's is an available option, proceed with insertion
      const res = await insertCourseLocation({ variables: { courseId: course.id, option: availableOption } });
      //extract the location id from the response
      const insertedLocationId = res?.data?.insert_CourseLocation?.returning[0].id;
      // loop through the session addresses and add the new location
      await Promise.all(
        course.Sessions.map((session) => {
          return insertSessionAddress({
            variables: {
              sessionId: session.id,
              location: availableOption,
              address: '',
              courseLocationId: insertedLocationId,
            },
          });
        })
      );
      qResult.refetch();
    } catch (error) {
      // Handle errors if any step in the try block fails
      handleError(error.message);
      // Optionally, re-throw the error if you want calling functions to be able to handle it as well
      throw error;
    }
  };

  // define a new function deleteCourseLocation that used the DELETE_COURSE location mutation with useRoleMutation
  const [deleteCourseLocation] = useRoleMutation<DeleteCourseLocation, DeleteCourseLocationVariables>(
    DELETE_COURSE_LOCATION,
    {
      onError: (error) => handleError(t(error.message)),
    }
  );
  const [DeleteSessionAddressesByCourseAndLocation] = useRoleMutation<
    DeleteSessionAddressesByCourseAndLocation,
    DeleteSessionAddressesByCourseAndLocationVariables
  >(DELETE_SESSION_ADDRESSES_BY_COURSE_AND_LOCATION, {
    onError: (error) => handleError(t(error.message)),
  });

  const handleDeleteCourseLocation = async (location) => {
    // Check the number of course locations
    if (course.CourseLocations.length <= 1) {
      // Handle the case where the location is the last one (e.g., show an error message)
      handleError('A course needs at least one location.');
      return; // Exit the function early
    }
    // If there's more than one location, proceed with deletion
    await deleteCourseLocation({ variables: { locationId: location.id } }); // Call the function directly
    await DeleteSessionAddressesByCourseAndLocation({
      variables: { courseId: course.id, location: location.locationOption },
    }); // Call the function directly
    qResult.refetch(); // Refetch the query to update the UI
  };

  const [updateCourseLocation] = useRoleMutation<UpdateCourseLocation, UpdateCourseLocationVariables>(
    UPDATE_COURSE_LOCATION,
    {
      onError: (error) => handleError(t(error.message)),
    }
  );

  const updateCourseStartTime = useUpdateCallback<UpdateCourseStartTime, UpdateCourseStartTimeVariables>(
    UPDATE_COURSE_START_TIME,
    'courseId',
    'startTime',
    course?.id,
    (time: string | null) => (time ? `${time}:00` : null),
    qResult
  );

  const updateCourseEndTime = useUpdateCallback<UpdateCourseEndTime, UpdateCourseEndTimeVariables>(
    UPDATE_COURSE_END_TIME,
    'courseId',
    'endTime',
    course?.id,
    (time: string | null) => (time ? `${time}:00` : null),
    qResult
  );

  const updateMaxParticipants = useUpdateCallback<UpdateCourseMaxParticipants, UpdateCourseMaxParticipantsVariables>(
    UPDATE_COURSE_MAX_PARTICIPANTS,
    'courseId',
    'maxParticipants',
    course?.id,
    eventTargetNumberMapper,
    qResult
  );

  const weekDayOptions = ['NONE', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const languageOptions = ['DE', 'EN'];

  const courseLocations = [...course.CourseLocations];
  courseLocations.sort((a, b) => a.id - b.id);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <EduHubTextFieldEditor
          value={course.tagline}
          label={t('short_description.label')}
          updateMutation={UPDATE_COURSE_SHORT_DESCRIPTION}
          refetchQuery={qResult}
          itemId={course.id}
          placeholder={t('short_description.label')}
          helpText={t('short_description.help_text')}
          className="h-64"
        />
        <EduHubTextFieldEditor
          value={course.learningGoals ?? ''}
          updateMutation={UPDATE_COURSE_LEARNING_GOALS}
          refetchQuery={qResult}
          itemId={course.id}
          label={t('learning_goals.label')}
          placeholder={t('learning_goals.placeholder')}
          helpText={t('learning_goals.help_text')}
          maxLength={500}
          className="h-64"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div>
          <EduHubTextFieldEditor
            element="input"
            value={course.headingDescriptionField1 ?? ''}
            itemId={course.id}
            updateMutation={UPDATE_COURSE_HEADING_DESCRIPTION_1}
            refetchQuery={qResult}
            label={t('info_block_1_title.label')}
            placeholder={t('info_block_1_title.placeholder')}
            helpText={t('info_block_1_title.help_text')}
            className="mb-0"
          />
          <EduHubTextFieldEditor
            value={course.contentDescriptionField1 ?? ''}
            itemId={course.id}
            updateMutation={UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1}
            refetchQuery={qResult}
            placeholder={t('info_block_1_content.placeholder')}
            maxLength={10000}
            className="h-64"
            isMarkdown={true}
          />
        </div>
        <div>
          <EduHubTextFieldEditor
            element="input"
            value={course.headingDescriptionField2 ?? ''}
            itemId={course.id}
            updateMutation={UPDATE_COURSE_HEADING_DESCRIPTION_2}
            refetchQuery={qResult}
            label={t('info_block_2_title.label')}
            helpText={t('info_block_2_title.help_text')}
            placeholder={t('info_block_2_title.placeholder')}
            className="mb-0"
          />
          <EduHubTextFieldEditor
            value={course.contentDescriptionField2 ?? ''}
            itemId={course.id}
            updateMutation={UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2}
            refetchQuery={qResult}
            placeholder={t('info_block_2_content.placeholder')}
            maxLength={10000}
            className="h-64"
            isMarkdown={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="grid grid-cols-3">
          <EduHubDropdownSelector
            label={t('weekday')}
            options={weekDayOptions}
            value={course.weekDay ?? 'MONDAY'}
            updateMutation={UPDATE_COURSE_WEEKDAY}
            idVariables={{ courseId: course.id }}
            refetchQueries={['ManagedCourse']}
            translationPrefix="course-page:weekdays."
            translationNamespace="course-page"
          />
          <EduHubTimePicker
            label={t('start_time')}
            value={getStartTimeString(course.startTime)}
            onChange={updateCourseStartTime}
            className="mb-4"
          />
          <EduHubTimePicker
            label={t('end_time')}
            value={getEndTimeString(course.endTime)}
            onChange={updateCourseEndTime}
            className="mb-4"
          />
          <div />
        </div>
        <div className="grid grid-cols-2">
          <EduHubDropdownSelector
            label={t('common:language')}
            options={languageOptions}
            value={course.language}
            updateMutation={UPDATE_COURSE_LANGUAGE}
            idVariables={{ courseId: course.id }}
            refetchQueries={['ManagedCourse']}
            translationPrefix="course-page:languages."
            translationNamespace="course-page"
          />
          <div>
            <EduHubNumberFieldEditor
              label={t('max_participants')}
              onChange={updateMaxParticipants}
              value={course.maxParticipants || 0}
              min={0}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-12 text-gray-400 px-2">
          <div className="col-span-2">{t('location.label')}</div>
          <div className="col-span-7">{t('address.label')}</div>
        </div>
        {courseLocations.map((loc) => (
          <Locations
            key={loc.id}
            location={loc}
            onDelete={handleDeleteCourseLocation}
            refetchQuery={qResult}
          />
        ))}
      </div>
      <div className="flex justify-start text-white">
        <Button onClick={handleInsertCourseLocation} startIcon={<MdAddCircle />} color="inherit">
          {t('course-page:add-new-location')}
        </Button>
      </div>
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </div>
  );
};
