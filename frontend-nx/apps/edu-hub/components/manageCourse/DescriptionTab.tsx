import { QueryResult } from '@apollo/client';
import { FC } from 'react';
import { useSession } from 'next-auth/react';
import { DebounceInput } from 'react-debounce-input';
import {
  eventTargetNumberMapper,
  eventTargetValueMapper,
  identityEventMapper,
  pickIdPkMapper,
  useDeleteCallback,
  useUpdateCallback,
  useUpdateCallback2,
} from '../../hooks/authedMutation';
import { useInstructorQuery } from '../../hooks/authedQuery';
import {
  DELETE_COURSE_LOCATION,
  INSERT_NEW_COURSE_LOCATION,
  LOCATION_OPTIONS,
  UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1,
  UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2,
  UPDATE_COURSE_END_TIME,
  UPDATE_COURSE_HEADING_DESCRIPTION_1,
  UPDATE_COURSE_HEADING_DESCRIPTION_2,
  UPDATE_COURSE_LANGUAGE,
  UPDATE_COURSE_LEARNING_GOALS,
  UPDATE_COURSE_SESSION_DEFAULT_ADDRESS,
  UPDATE_COURSE_LOCATION_OPTION,
  UPDATE_COURSE_MAX_PARTICIPANTS,
  UPDATE_COURSE_START_TIME,
  UPDATE_COURSE_TAGLINE,
  UPDATE_COURSE_WEEKDAY,
} from '../../queries/course';
import {
  DeleteCourseLocation,
  DeleteCourseLocationVariables,
} from '../../queries/__generated__/DeleteCourseLocation';
import {
  InsertCourseLocation,
  InsertCourseLocationVariables,
} from '../../queries/__generated__/InsertCourseLocation';
import { LocationOptionsKnown } from '../../queries/__generated__/LocationOptionsKnown';
import { ManagedCourse_Course_by_pk } from '../../queries/__generated__/ManagedCourse';
import {
  UpdateCourseContentDescriptionField1,
  UpdateCourseContentDescriptionField1Variables,
} from '../../queries/__generated__/UpdateCourseContentDescriptionField1';
import {
  UpdateCourseContentDescriptionField2,
  UpdateCourseContentDescriptionField2Variables,
} from '../../queries/__generated__/UpdateCourseContentDescriptionField2';
import {
  UpdateCourseEndTime,
  UpdateCourseEndTimeVariables,
} from '../../queries/__generated__/UpdateCourseEndTime';
import {
  UpdateCourseHeadingDescription1,
  UpdateCourseHeadingDescription1Variables,
} from '../../queries/__generated__/UpdateCourseHeadingDescription1';
import {
  UpdateCourseHeadingDescription2,
  UpdateCourseHeadingDescription2Variables,
} from '../../queries/__generated__/UpdateCourseHeadingDescription2';
import {
  UpdateCourseLanguage,
  UpdateCourseLanguageVariables,
} from '../../queries/__generated__/UpdateCourseLanguage';
import {
  UpdateCourseLearningGoals,
  UpdateCourseLearningGoalsVariables,
} from '../../queries/__generated__/UpdateCourseLearningGoals';
import {
  UpdateCourseDefaultSessionAddress,
  UpdateCourseDefaultSessionAddressVariables,
} from '../../queries/__generated__/UpdateCourseDefaultSessionAddress';
import {
  UpdateCourseLocationOption,
  UpdateCourseLocationOptionVariables,
} from '../../queries/__generated__/UpdateCourseLocationOption';
import {
  UpdateCourseStartTime,
  UpdateCourseStartTimeVariables,
} from '../../queries/__generated__/UpdateCourseStartTime';
import {
  UpdateCourseWeekday,
  UpdateCourseWeekdayVariables,
} from '../../queries/__generated__/UpdateCourseWeekday';
import EhTimeSelect, { formatTime } from '../common/EhTimeSelect';
import { LocationSelectionRow } from './LocationSelectionRow';
import { Button } from '@material-ui/core';
import { MdAddCircle } from 'react-icons/md';
import {
  UpdateCourseTagline,
  UpdateCourseTaglineVariables,
} from '../../queries/__generated__/UpdateCourseTagline';
import {
  UpdateCourseMaxParticipants,
  UpdateCourseMaxParticipantsVariables,
} from '../../queries/__generated__/UpdateCourseMaxParticipants';
import useTranslation from 'next-translate/useTranslation';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

const prepDateTimeUpdate = (timeString: string) => {
  const now = new Date();
  const [hourS, minS] = timeString.split(':');
  now.setHours(Number(hourS));
  now.setMinutes(Number(minS));
  return now.toISOString();
};

const constantOnlineMapper = () => 'ONLINE';

export const DescriptionTab: FC<IProps> = ({ course, qResult }) => {
  const { data } = useSession();
  const currentUpdateRole = data.profile['https://hasura.io/jwt/claims'][
    'x-hasura-allowed-roles'
  ].includes('admin')
    ? 'admin'
    : 'instructor';

  const queryKnownLocationOptions =
    useInstructorQuery<LocationOptionsKnown>(LOCATION_OPTIONS);
  if (queryKnownLocationOptions.error) {
    console.log(
      'query known location options error',
      queryKnownLocationOptions.error
    );
  }

  const locationOptions = (
    queryKnownLocationOptions.data?.LocationOption || []
  ).map((x) => x.value);

  const insertCourseLocation = useUpdateCallback<
    InsertCourseLocation,
    InsertCourseLocationVariables
  >(
    INSERT_NEW_COURSE_LOCATION,
    currentUpdateRole,
    'courseId',
    'option',
    course?.id,
    constantOnlineMapper,
    qResult
  );

  const deleteCourseLocation = useDeleteCallback<
    DeleteCourseLocation,
    DeleteCourseLocationVariables
  >(
    DELETE_COURSE_LOCATION,
    currentUpdateRole,
    'locationId',
    pickIdPkMapper,
    qResult
  );

  const updateCourseLocationOption = useUpdateCallback2<
    UpdateCourseLocationOption,
    UpdateCourseLocationOptionVariables
  >(
    UPDATE_COURSE_LOCATION_OPTION,
    currentUpdateRole,
    'locationId',
    'option',
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const updateCourseDefaultSessionAddress = useUpdateCallback2<
    UpdateCourseDefaultSessionAddress,
    UpdateCourseDefaultSessionAddressVariables
  >(
    UPDATE_COURSE_SESSION_DEFAULT_ADDRESS,
    currentUpdateRole,
    'locationId',
    'defaultSessionAddress',
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const updateCourseStartTime = useUpdateCallback<
    UpdateCourseStartTime,
    UpdateCourseStartTimeVariables
  >(
    UPDATE_COURSE_START_TIME,
    currentUpdateRole,
    'courseId',
    'startTime',
    course?.id,
    prepDateTimeUpdate,
    qResult
  );

  const updateCourseEndTime = useUpdateCallback<
    UpdateCourseEndTime,
    UpdateCourseEndTimeVariables
  >(
    UPDATE_COURSE_END_TIME,
    currentUpdateRole,
    'courseId',
    'endTime',
    course?.id,
    prepDateTimeUpdate,
    qResult
  );

  const updateCourseLanguage = useUpdateCallback<
    UpdateCourseLanguage,
    UpdateCourseLanguageVariables
  >(
    UPDATE_COURSE_LANGUAGE,
    currentUpdateRole,
    'courseId',
    'language',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateWeekday = useUpdateCallback<
    UpdateCourseWeekday,
    UpdateCourseWeekdayVariables
  >(
    UPDATE_COURSE_WEEKDAY,
    currentUpdateRole,
    'courseId',
    'weekday',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateContent1 = useUpdateCallback<
    UpdateCourseContentDescriptionField1,
    UpdateCourseContentDescriptionField1Variables
  >(
    UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1,
    currentUpdateRole,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateContent2 = useUpdateCallback<
    UpdateCourseContentDescriptionField2,
    UpdateCourseContentDescriptionField2Variables
  >(
    UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2,
    currentUpdateRole,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateHeading1 = useUpdateCallback<
    UpdateCourseHeadingDescription1,
    UpdateCourseHeadingDescription1Variables
  >(
    UPDATE_COURSE_HEADING_DESCRIPTION_1,
    currentUpdateRole,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateHeading2 = useUpdateCallback<
    UpdateCourseHeadingDescription2,
    UpdateCourseHeadingDescription2Variables
  >(
    UPDATE_COURSE_HEADING_DESCRIPTION_2,
    currentUpdateRole,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateLearningGoals = useUpdateCallback<
    UpdateCourseLearningGoals,
    UpdateCourseLearningGoalsVariables
  >(
    UPDATE_COURSE_LEARNING_GOALS,
    currentUpdateRole,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateTagline = useUpdateCallback<
    UpdateCourseTagline,
    UpdateCourseTaglineVariables
  >(
    UPDATE_COURSE_TAGLINE,
    currentUpdateRole,
    'courseId',
    'tagline',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateMaxParticipants = useUpdateCallback<
    UpdateCourseMaxParticipants,
    UpdateCourseMaxParticipantsVariables
  >(
    UPDATE_COURSE_MAX_PARTICIPANTS,
    currentUpdateRole,
    'courseId',
    'maxParticipants',
    course?.id,
    eventTargetNumberMapper,
    qResult
  );
  const { t } = useTranslation();

  const courseLocations = [...course.CourseLocations];
  courseLocations.sort((a, b) => a.id - b.id);
  return (
    <div>
      <div className="grid grid-cols-2 text-gray-400">
        <div className="mr-3 ml-3">{`${t('course-page:short-description')} (${t(
          'course-page:max-n-characters',
          { n: 200 }
        )})`}</div>
        <div className="mr-3 ml-3">{`${t('course-page:learning-goal')} (${t(
          'course-page:max-n-characters',
          { n: 500 }
        )})`}</div>
      </div>
      <div className="grid grid-cols-2 mb-8">
        <DebounceInput
          maxLength={200}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateTagline}
          forceNotifyByEnter={false}
          element={'textarea'}
          value={course.tagline}
        />
        <DebounceInput
          maxLength={500}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateLearningGoals}
          forceNotifyByEnter={false}
          element={'textarea'}
          value={course.learningGoals ?? ''}
        />
      </div>

      <div className="grid grid-cols-2 text-gray-400">
        <div className="mr-3 ml-3">{`${t(
          'course-page:title-info-block'
        )} 1 (${t('course-page:max-n-characters', { n: 200 })})`}</div>
        <div className="mr-3 ml-3">{`${t(
          'course-page:title-info-block'
        )} 2 (${t('course-page:max-n-characters', { n: 200 })})`}</div>
      </div>
      <div className="grid grid-cols-2 mb-8">
        <DebounceInput
          maxLength={200}
          debounceTimeout={1000}
          className="h-8 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateHeading1}
          value={course.headingDescriptionField1 ?? ''}
        />

        <DebounceInput
          maxLength={200}
          debounceTimeout={1000}
          className="h-8 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateHeading2}
          value={course.headingDescriptionField2 ?? ''}
        />
      </div>

      <div className="grid grid-cols-2 text-gray-400">
        <div className="mr-3 ml-3">{`${t(
          'course-page:title-info-block'
        )} 1 (${t('course-page:max-n-characters', { n: 10000 })})`}</div>
        <div className="mr-3 ml-3">{`${t(
          'course-page:title-info-block'
        )} 2 (${t('course-page:max-n-characters', { n: 10000 })})`}</div>
      </div>
      <div className="grid grid-cols-2 mb-8">
        <DebounceInput
          maxLength={10000}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateContent1}
          forceNotifyByEnter={false}
          element={'textarea'}
          value={course.contentDescriptionField1 ?? ''}
        />
        <DebounceInput
          maxLength={10000}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateContent2}
          forceNotifyByEnter={false}
          element={'textarea'}
          value={course.contentDescriptionField2 ?? ''}
        />
      </div>

      <div className="grid grid-cols-2 mb-8">
        <div className="grid grid-cols-2">
          <div className="grid grid-cols-3">
            <div className="mr-3 ml-3">
              <div className="text-gray-400">{t('course-page:day')}</div>
              <div>
                <select
                  value={course.weekDay ?? 'MONDAY'}
                  onChange={updateWeekday}
                  className="w-full h-8 bg-edu-light-gray"
                >
                  <option value="MONDAY">{t('MONDAY')}</option>
                  <option value="TUESDAY">{t('TUESDAY')}</option>
                  <option value="WEDNESDAY">{t('WEDNESDAY')}</option>
                  <option value="THURSDAY">{t('THURSDAY')}</option>
                  <option value="FRIDAY">{t('FRIDAY')}</option>
                  <option value="SATURDAY">{t('SATURDAY')}</option>
                  <option value="SUNDAY">{t('SUNDAY')}</option>
                </select>
              </div>
            </div>
            <div className="mr-3 ml-3">
              <div className="text-gray-400">{t('course-page:start-time')}</div>
              <div>
                <EhTimeSelect
                  value={formatTime(course.startTime)}
                  className="h-8 w-full bg-edu-light-gray"
                  onChange={updateCourseStartTime}
                />
              </div>
            </div>
            <div className="mr-3 ml-3">
              <div className="text-gray-400">{t('course-page:end-time')}</div>
              <div>
                <EhTimeSelect
                  value={formatTime(course.endTime)}
                  className="h-8 w-full bg-edu-light-gray"
                  onChange={updateCourseEndTime}
                />
              </div>
            </div>
          </div>
          <div />
        </div>
        <div className="grid grid-cols-2 mb-8">
          <div className="mr-3 ml-3">
            <div className="text-gray-400">{t('language')}</div>
            <div>
              <select
                value={course.language}
                onChange={updateCourseLanguage}
                className="w-full h-8 bg-edu-light-gray"
              >
                <option value="DE">{t('DE')}</option>
                <option value="EN">{t('EN')}</option>
              </select>
            </div>
          </div>
          <div className="mr-3 ml-3">
            <div className="text-gray-400">
              {t('course-page:max-part-quantity')}
            </div>
            <div>
              <DebounceInput
                type="number"
                className="w-full h-8 bg-edu-light-gray"
                debounceTimeout={1000}
                onChange={updateMaxParticipants}
                value={course.maxParticipants || 0}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-start mb-2 text-white">
        <Button
          onClick={insertCourseLocation}
          startIcon={<MdAddCircle />}
          color="inherit"
        >
          {t('course-page:add-new-location')}
        </Button>
      </div>

      <div className="mb-8">
        <LocationSelectionRow
          location={null}
          onDelete={deleteCourseLocation}
          onSetLink={updateCourseDefaultSessionAddress}
          onSetOption={updateCourseLocationOption}
          options={locationOptions}
        />
        {courseLocations.map((loc) => (
          <LocationSelectionRow
            key={loc.id}
            location={loc}
            options={locationOptions}
            onDelete={deleteCourseLocation}
            onSetLink={updateCourseDefaultSessionAddress}
            onSetOption={updateCourseLocationOption}
          />
        ))}
      </div>
    </div>
  );
};
