import { QueryResult } from '@apollo/client';
import { FC } from 'react';
import { DebounceInput } from 'react-debounce-input';
import {
  eventTargetNumberMapper,
  eventTargetValueMapper,
  identityEventMapper,
  pickIdPkMapper,
  useDeleteCallback,
  useUpdateCallback,
  useUpdateCallback2,
} from '../../../../hooks/authedMutation';
import { useRoleQuery } from '../../../../hooks/authedQuery';
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
} from '../../../../queries/course';
import {
  DeleteCourseLocation,
  DeleteCourseLocationVariables,
} from '../../../../queries/__generated__/DeleteCourseLocation';
import {
  InsertCourseLocation,
  InsertCourseLocationVariables,
} from '../../../../queries/__generated__/InsertCourseLocation';
import { LocationOptionsKnown } from '../../../../queries/__generated__/LocationOptionsKnown';
import { ManagedCourse_Course_by_pk } from '../../../../queries/__generated__/ManagedCourse';
import {
  UpdateCourseContentDescriptionField1,
  UpdateCourseContentDescriptionField1Variables,
} from '../../../../queries/__generated__/UpdateCourseContentDescriptionField1';
import {
  UpdateCourseContentDescriptionField2,
  UpdateCourseContentDescriptionField2Variables,
} from '../../../../queries/__generated__/UpdateCourseContentDescriptionField2';
import {
  UpdateCourseEndTime,
  UpdateCourseEndTimeVariables,
} from '../../../../queries/__generated__/UpdateCourseEndTime';
import {
  UpdateCourseHeadingDescription1,
  UpdateCourseHeadingDescription1Variables,
} from '../../../../queries/__generated__/UpdateCourseHeadingDescription1';
import {
  UpdateCourseHeadingDescription2,
  UpdateCourseHeadingDescription2Variables,
} from '../../../../queries/__generated__/UpdateCourseHeadingDescription2';
import {
  UpdateCourseLanguage,
  UpdateCourseLanguageVariables,
} from '../../../../queries/__generated__/UpdateCourseLanguage';
import {
  UpdateCourseLearningGoals,
  UpdateCourseLearningGoalsVariables,
} from '../../../../queries/__generated__/UpdateCourseLearningGoals';
import {
  UpdateCourseDefaultSessionAddress,
  UpdateCourseDefaultSessionAddressVariables,
} from '../../../../queries/__generated__/UpdateCourseDefaultSessionAddress';
import {
  UpdateCourseLocationOption,
  UpdateCourseLocationOptionVariables,
} from '../../../../queries/__generated__/UpdateCourseLocationOption';
import {
  UpdateCourseStartTime,
  UpdateCourseStartTimeVariables,
} from '../../../../queries/__generated__/UpdateCourseStartTime';
import {
  UpdateCourseWeekday,
  UpdateCourseWeekdayVariables,
} from '../../../../queries/__generated__/UpdateCourseWeekday';
import { formatTime } from '../../../common/EhTimeSelect';
import { LocationSelectionRow } from './LocationSelectionRow';
import { Button } from '@material-ui/core';
import { MdAddCircle } from 'react-icons/md';
import {
  UpdateCourseTagline,
  UpdateCourseTaglineVariables,
} from '../../../../queries/__generated__/UpdateCourseTagline';
import {
  UpdateCourseMaxParticipants,
  UpdateCourseMaxParticipantsVariables,
} from '../../../../queries/__generated__/UpdateCourseMaxParticipants';
import useTranslation from 'next-translate/useTranslation';
import EduHubTextFieldEditor from '../../../forms/EduHubTextFieldEditor';
import EduHubDropdownSelector from '../../../forms/EduHubDropdownSelector';
import EduHubTimePicker from '../../../forms/EduHubTimePicker';
import EduHubNumberFieldEditor from '../../../forms/EduHubNumberFieldEditor';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

const prepDateTimeUpdate = (timeString: string) => {
  // Ensure timeString is a string and is not empty
  if (typeof timeString !== 'string' || !timeString.includes(':')) {
    console.error('Invalid timeString:', timeString);
    return ''; // or some fallback value like the current time
  }

  const now = new Date();
  const [hourS, minS] = timeString.split(':');
  now.setHours(Number(hourS));
  now.setMinutes(Number(minS));
  return now.toISOString();
};

const constantOnlineMapper = () => 'ONLINE';

export const DescriptionTab: FC<IProps> = ({ course, qResult }) => {
  const updateHeading1 = useUpdateCallback<UpdateCourseHeadingDescription1, UpdateCourseHeadingDescription1Variables>(
    UPDATE_COURSE_HEADING_DESCRIPTION_1,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );
  const updateContent1 = useUpdateCallback<
    UpdateCourseContentDescriptionField1,
    UpdateCourseContentDescriptionField1Variables
  >(UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_1, 'courseId', 'description', course?.id, eventTargetValueMapper, qResult);

  const updateHeading2 = useUpdateCallback<UpdateCourseHeadingDescription2, UpdateCourseHeadingDescription2Variables>(
    UPDATE_COURSE_HEADING_DESCRIPTION_2,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );
  const updateContent2 = useUpdateCallback<
    UpdateCourseContentDescriptionField2,
    UpdateCourseContentDescriptionField2Variables
  >(UPDATE_COURSE_CONTENT_DESCRIPTION_FIELD_2, 'courseId', 'description', course?.id, eventTargetValueMapper, qResult);

  const updateShortDescription = useUpdateCallback<UpdateCourseTagline, UpdateCourseTaglineVariables>(
    UPDATE_COURSE_TAGLINE,
    'courseId',
    'tagline',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateLearningGoals = useUpdateCallback<UpdateCourseLearningGoals, UpdateCourseLearningGoalsVariables>(
    UPDATE_COURSE_LEARNING_GOALS,
    'courseId',
    'description',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const insertCourseLocation = useUpdateCallback<InsertCourseLocation, InsertCourseLocationVariables>(
    INSERT_NEW_COURSE_LOCATION,
    'courseId',
    'option',
    course?.id,
    constantOnlineMapper,
    qResult
  );

  const deleteCourseLocation = useDeleteCallback<DeleteCourseLocation, DeleteCourseLocationVariables>(
    DELETE_COURSE_LOCATION,
    'locationId',
    pickIdPkMapper,
    qResult
  );

  const updateCourseLocationOption = useUpdateCallback2<
    UpdateCourseLocationOption,
    UpdateCourseLocationOptionVariables
  >(UPDATE_COURSE_LOCATION_OPTION, 'locationId', 'option', pickIdPkMapper, identityEventMapper, qResult);

  const updateCourseDefaultSessionAddress = useUpdateCallback2<
    UpdateCourseDefaultSessionAddress,
    UpdateCourseDefaultSessionAddressVariables
  >(
    UPDATE_COURSE_SESSION_DEFAULT_ADDRESS,
    'locationId',
    'defaultSessionAddress',
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const updateCourseStartTime = useUpdateCallback<UpdateCourseStartTime, UpdateCourseStartTimeVariables>(
    UPDATE_COURSE_START_TIME,
    'courseId',
    'startTime',
    course?.id,
    prepDateTimeUpdate,
    qResult
  );

  const updateCourseEndTime = useUpdateCallback<UpdateCourseEndTime, UpdateCourseEndTimeVariables>(
    UPDATE_COURSE_END_TIME,
    'courseId',
    'endTime',
    course?.id,
    prepDateTimeUpdate,
    qResult
  );

  const updateCourseLanguage = useUpdateCallback<UpdateCourseLanguage, UpdateCourseLanguageVariables>(
    UPDATE_COURSE_LANGUAGE,
    'courseId',
    'language',
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateWeekday = useUpdateCallback<UpdateCourseWeekday, UpdateCourseWeekdayVariables>(
    UPDATE_COURSE_WEEKDAY,
    'courseId',
    'weekday',
    course?.id,
    eventTargetValueMapper,
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
  const { t } = useTranslation('course-page');

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

  const courseLocations = [...course.CourseLocations];
  courseLocations.sort((a, b) => a.id - b.id);
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <EduHubTextFieldEditor
          label={t('short_description.label')}
          placeholder={t('short_description.label')}
          helpText={t('short_description.help_text')}
          className="h-64"
          onChange={updateShortDescription}
          value={course.tagline}
        />
        <EduHubTextFieldEditor
          label={t('learning_goals.label')}
          placeholder={t('learning_goals.placeholder')}
          helpText={t('learning_goals.help_text')}
          maxLength={500}
          className="h-64"
          onChange={updateLearningGoals}
          value={course.learningGoals ?? ''}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div>
          <EduHubTextFieldEditor
            element="input"
            label={t('info_block_1_title.label')}
            placeholder={t('info_block_1_title.placeholder')}
            helpText={t('info_block_1_title.help_text')}
            onChange={updateHeading1}
            value={course.headingDescriptionField1 ?? ''}
            className="mb-0"
          />
          <EduHubTextFieldEditor
            placeholder={t('info_block_1_content.placeholder')}
            maxLength={10000}
            className="h-64"
            onChange={updateContent1}
            value={course.contentDescriptionField1 ?? ''}
            isMarkdown={true}
          />
        </div>
        <div>
          <EduHubTextFieldEditor
            element="input"
            label={t('info_block_2_title.label')}
            helpText={t('info_block_2_title.help_text')}
            placeholder={t('info_block_2_title.placeholder')}
            onChange={updateHeading2}
            value={course.headingDescriptionField2 ?? ''}
            className="mb-0"
          />
          <EduHubTextFieldEditor
            placeholder={t('info_block_1_content.placeholder')}
            maxLength={10000}
            className="h-64"
            onChange={updateContent2}
            value={course.contentDescriptionField2 ?? ''}
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
            onChange={updateWeekday}
          />
          <EduHubTimePicker
            label={t('start_time')}
            value={formatTime(course.startTime)}
            onChange={updateCourseStartTime}
            className="mb-4"
          />
          <EduHubTimePicker
            label={t('end_time')}
            value={formatTime(course.endTime)}
            onChange={updateCourseEndTime}
            className="mb-4"
          />
          <div />
        </div>
        <div className="grid grid-cols-2 mb-8">
          <EduHubDropdownSelector
            label={t('common:language')}
            options={languageOptions}
            value={course.language}
            onChange={updateCourseLanguage}
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
          <LocationSelectionRow
            key={loc.id}
            location={loc}
            onDelete={deleteCourseLocation}
            onSetLink={updateCourseDefaultSessionAddress}
            onSetOption={updateCourseLocationOption}
          />
        ))}
      </div>
      <div className="flex justify-start mb-2 text-white">
        <Button onClick={insertCourseLocation} startIcon={<MdAddCircle />} color="inherit">
          {t('course-page:add-new-location')}
        </Button>
      </div>
    </div>
  );
};
