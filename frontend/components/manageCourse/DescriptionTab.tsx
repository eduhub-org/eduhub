import { QueryResult } from "@apollo/client";
import { FC } from "react";
import { DebounceInput } from "react-debounce-input";
import {
  eventTargetValueMapper,
  identityEventMapper,
  pickIdPkMapper,
  useAdminMutation,
  useDeleteCallback,
  useUpdateCallback,
  useUpdateCallback2,
} from "../../hooks/authedMutation";
import { useInstructorQuery } from "../../hooks/authedQuery";
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
  UPDATE_COURSE_LOCATION_LINK,
  UPDATE_COURSE_LOCATION_OPTION,
  UPDATE_COURSE_START_TIME,
  UPDATE_COURSE_TAGLINE,
  UPDATE_COURSE_WEEKDAY,
} from "../../queries/course";
import {
  DeleteCourseLocation,
  DeleteCourseLocationVariables,
} from "../../queries/__generated__/DeleteCourseLocation";
import {
  InsertCourseLocation,
  InsertCourseLocationVariables,
} from "../../queries/__generated__/InsertCourseLocation";
import { LocationOptionsKnown } from "../../queries/__generated__/LocationOptionsKnown";
import { ManagedCourse_Course_by_pk } from "../../queries/__generated__/ManagedCourse";
import {
  UpdateCourseContentDescriptionField1,
  UpdateCourseContentDescriptionField1Variables,
} from "../../queries/__generated__/UpdateCourseContentDescriptionField1";
import {
  UpdateCourseContentDescriptionField2,
  UpdateCourseContentDescriptionField2Variables,
} from "../../queries/__generated__/UpdateCourseContentDescriptionField2";
import {
  UpdateCourseEndTime,
  UpdateCourseEndTimeVariables,
} from "../../queries/__generated__/UpdateCourseEndTime";
import {
  UpdateCourseHeadingDescription1,
  UpdateCourseHeadingDescription1Variables,
} from "../../queries/__generated__/UpdateCourseHeadingDescription1";
import {
  UpdateCourseHeadingDescription2,
  UpdateCourseHeadingDescription2Variables,
} from "../../queries/__generated__/UpdateCourseHeadingDescription2";
import {
  UpdateCourseLanguage,
  UpdateCourseLanguageVariables,
} from "../../queries/__generated__/UpdateCourseLanguage";
import {
  UpdateCourseLearningGoals,
  UpdateCourseLearningGoalsVariables,
} from "../../queries/__generated__/UpdateCourseLearningGoals";
import {
  UpdateCourseLocationLink,
  UpdateCourseLocationLinkVariables,
} from "../../queries/__generated__/UpdateCourseLocationLink";
import {
  UpdateCourseLocationOption,
  UpdateCourseLocationOptionVariables,
} from "../../queries/__generated__/UpdateCourseLocationOption";
import {
  UpdateCourseStartTime,
  UpdateCourseStartTimeVariables,
} from "../../queries/__generated__/UpdateCourseStartTime";
import {
  UpdateCourseWeekday,
  UpdateCourseWeekdayVariables,
} from "../../queries/__generated__/UpdateCourseWeekday";
import EhTimeSelect, {
  extractLocalTimeFromTimeTz,
} from "../common/EhTimeSelect";
import { LocationSelectionRow } from "./LocationSelectionRow";
import { Button } from "@material-ui/core";
import { MdAddCircle } from "react-icons/md";
import { UpdateCourseByPk, UpdateCourseByPkVariables } from "../../queries/__generated__/UpdateCourseByPk";
import { UPDATE_COURSE_PROPERTY } from "../../queries/mutateCourse";
import { UpdateCourseTagline, UpdateCourseTaglineVariables } from "../../queries/__generated__/UpdateCourseTagline";

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

const noop = () => {
  console.log("Noop!");
};

const getLegacyLanguage = (legacy: string | null) => {
  if (legacy == null) {
    return "German";
  }
  const lowLegacy = legacy.toLocaleLowerCase();
  if (lowLegacy.includes("deutsch") || lowLegacy.includes("german")) {
    return "German";
  } else {
    return "English";
  }
};

const prepTimeTz = (timeString: string) => {
  const offset = new Date().getTimezoneOffset() / 60;
  const offsetNegative = offset < 0;
  const absOffset = Math.abs(offset);
  let offSetString = `${absOffset < 10 ? "0" : ""}${absOffset}`;
  if (offsetNegative) {
    offSetString = "-" + offSetString;
  }
  const timetz = timeString + offSetString + ":00";
  console.log(timeString + " => " + timetz);
  return timetz;
};

const constantOnlineMapper = () => "ONLINE";

export const DescriptionTab: FC<IProps> = ({ course, qResult }) => {
  // TODO set to instructor once that works
  const currentUpdateRole = "admin";

  const queryKnownLocationOptions = useInstructorQuery<LocationOptionsKnown>(
    LOCATION_OPTIONS
  );
  if (queryKnownLocationOptions.error) {
    console.log(
      "query known location options error",
      queryKnownLocationOptions.error
    );
  }

  const locationOptions = (
    queryKnownLocationOptions.data?.LocationOption || []
  ).map((x) => x.value);

  const insertLocationOption = useUpdateCallback<
    InsertCourseLocation,
    InsertCourseLocationVariables
  >(
    INSERT_NEW_COURSE_LOCATION,
    currentUpdateRole,
    "courseId",
    "option",
    course?.id,
    constantOnlineMapper,
    qResult
  );

  const deleteLocationOption = useDeleteCallback<
    DeleteCourseLocation,
    DeleteCourseLocationVariables
  >(
    DELETE_COURSE_LOCATION,
    currentUpdateRole,
    "locationId",
    pickIdPkMapper,
    qResult
  );

  const updateCourseLocationOption = useUpdateCallback2<
    UpdateCourseLocationOption,
    UpdateCourseLocationOptionVariables
  >(
    UPDATE_COURSE_LOCATION_OPTION,
    currentUpdateRole,
    "locationId",
    "option",
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const updateCourseLocationLink = useUpdateCallback2<
    UpdateCourseLocationLink,
    UpdateCourseLocationLinkVariables
  >(
    UPDATE_COURSE_LOCATION_LINK,
    currentUpdateRole,
    "locationId",
    "link",
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
    "courseId",
    "startTime",
    course?.id,
    prepTimeTz,
    qResult
  );

  const updateCourseEndTime = useUpdateCallback<
    UpdateCourseEndTime,
    UpdateCourseEndTimeVariables
  >(
    UPDATE_COURSE_END_TIME,
    currentUpdateRole,
    "courseId",
    "endTime",
    course?.id,
    prepTimeTz,
    qResult
  );

  const updateCourseLanguage = useUpdateCallback<
    UpdateCourseLanguage,
    UpdateCourseLanguageVariables
  >(
    UPDATE_COURSE_LANGUAGE,
    currentUpdateRole,
    "courseId",
    "language",
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
    "courseId",
    "weekday",
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
    "courseId",
    "description",
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
    "courseId",
    "description",
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
    "courseId",
    "description",
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
    "courseId",
    "description",
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
    "courseId",
    "description",
    course?.id,
    eventTargetValueMapper,
    qResult
  );

  const updateTagline = useUpdateCallback<
    UpdateCourseTagline,
    UpdateCourseTaglineVariables
  >(UPDATE_COURSE_TAGLINE,
    currentUpdateRole,
    "courseId",
    "tagline",
    course?.id,
    eventTargetValueMapper,
    qResult);

  const courseLocations = [...course.CourseLocations];
  courseLocations.sort((a, b) => a.id - b.id);

  return (
    <div>
      <div className="grid grid-cols-2 ">
        <div className="mr-3 ml-3">Kurzbeschreibung (max. 200 Zeichen)</div>
        <div className="mr-3 ml-3">Lernziele (max. 500 Zeichen)</div>
      </div>
      <div className="grid grid-cols-2 mb-8">
        <DebounceInput
          maxLength={200}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateTagline}
          forceNotifyByEnter={false}
          element={"textarea"}
          value={course.tagline}
        />
        <DebounceInput
          maxLength={500}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateLearningGoals}
          forceNotifyByEnter={false}
          element={"textarea"}
          value={course.learningGoals ?? ""}
        />
      </div>

      <div className="grid grid-cols-2">
        <div className="mr-3 ml-3">Titel Info Block 1 (max. 50 Zeichen)</div>
        <div className="mr-3 ml-3">Titel Info Block 2 (max. 50 Zeichen)</div>
      </div>
      <div className="grid grid-cols-2 mb-8">
        <DebounceInput
          maxLength={50}
          debounceTimeout={1000}
          className="h-8 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateHeading1}
          value={course.headingDescriptionField1 ?? ""}
        />

        <DebounceInput
          maxLength={50}
          debounceTimeout={1000}
          className="h-8 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateHeading2}
          value={course.headingDescriptionField2 ?? ""}
        />
      </div>

      <div className="grid grid-cols-2">
        <div className="mr-3 ml-3">Text Info Block 1 (max. 1500 Zeichen)</div>
        <div className="mr-3 ml-3">Text Info Block 2 (max. 1500 Zeichen)</div>
      </div>
      <div className="grid grid-cols-2 mb-8">
        <DebounceInput
          maxLength={1500}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateContent1}
          forceNotifyByEnter={false}
          element={"textarea"}
          value={course.contentDescriptionField1 ?? ""}
        />
        <DebounceInput
          maxLength={1500}
          debounceTimeout={1000}
          className="h-64 mr-3 ml-3 bg-edu-light-gray"
          onChange={updateContent2}
          forceNotifyByEnter={false}
          element={"textarea"}
          value={course.contentDescriptionField2 ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 mb-8">
        <div className="grid grid-cols-2">
          <div className="grid grid-cols-3">
            <div className="mr-3 ml-3">
              <div>Tag</div>
              <div>
                <select
                  value={course.weekDay ?? "Monday"}
                  onChange={updateWeekday}
                  className="w-full h-8 bg-edu-light-gray"
                >
                  <option value="Monday">Mo</option>
                  <option value="Tuesday">DI</option>
                  <option value="Wednesday">MI</option>
                  <option value="Thursday">DO</option>
                  <option value="Friday">FR</option>
                  <option value="Saturday">SA</option>
                  <option value="Sunday">SO</option>
                </select>
              </div>
            </div>
            <div className="mr-3 ml-3">
              <div>Startzeit</div>
              <div>
                <EhTimeSelect
                  value={extractLocalTimeFromTimeTz(course.startTime)}
                  className="h-8 w-full bg-edu-light-gray"
                  onChange={updateCourseStartTime}
                />
              </div>
            </div>
            <div className="mr-3 ml-3">
              <div>Endzeit</div>
              <div>
                <EhTimeSelect
                  value={extractLocalTimeFromTimeTz(course.endTime)}
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
            <div>Sprache</div>
            <div>
              <select
                value={getLegacyLanguage(course.language)}
                onChange={updateCourseLanguage}
                className="w-full h-8 bg-edu-light-gray"
              >
                <option value="German">Deutsch</option>
                <option value="English">Englisch</option>
              </select>
            </div>
          </div>
          <div className="mr-3 ml-3">
            <div>Max. Teil. Anzahl</div>
            <div>
              {/*
                                        Field is missing in the database?!
                                    */}
              <input className="w-full h-8 bg-edu-light-gray" type="number" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <LocationSelectionRow
          location={null}
          onDelete={deleteLocationOption}
          onSetLink={updateCourseLocationLink}
          onSetOption={updateCourseLocationOption}
          options={locationOptions}
        />
        {courseLocations.map((loc) => (
          <LocationSelectionRow
            key={loc.id}
            location={loc}
            options={locationOptions}
            onDelete={deleteLocationOption}
            onSetLink={updateCourseLocationLink}
            onSetOption={updateCourseLocationOption}
          />
        ))}
      </div>

      <div className="flex justify-end mb-8">
        <Button onClick={insertLocationOption} startIcon={<MdAddCircle />}>
          neuen Ort hinzufügen
        </Button>
      </div>
    </div>
  );
};
