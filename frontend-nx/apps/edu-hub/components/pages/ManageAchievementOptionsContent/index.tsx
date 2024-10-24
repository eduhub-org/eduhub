import { CircularProgress, IconButton } from '@mui/material';
import { Button } from '@mui/material';
import { MdAddCircle } from 'react-icons/md';
import { IUserProfile } from '../../../hooks/user';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { MdDelete, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { makeFullName } from '../../../helpers/util';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { ACHIEVEMENT_OPTIONS } from '../../../queries/achievementOption';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import {
  AchievementOptionList,
  AchievementOptionListVariables,
  AchievementOptionList_AchievementOption,
} from '../../../queries/__generated__/AchievementOptionList';
import { Programs, Programs_Program } from '../../../queries/__generated__/Programs';
import { StaticComponentProperty } from '../../../types/UIComponents';
import { AlertMessageDialog } from '../../common/dialogs/AlertMessageDialog';
import AddButton from '../../common/AddButton';
import EhTag from '../../common/EhTag';
import TagWithTwoText from '../../common/TagWithTwoText';
import { ProgramsMenubar } from '../../layout/ProgramsMenubar';
import AchievementsHelper, { AchievementContext, IPropsDashBoard } from './AchievementsHelper';
import AddAchievementOption from './AddAchievementOption';
import EditAchievementOption from './EditAchievementOption';

const ManageAchievementOptionsContent: FC<{
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
  achievementRecordTypes: string[];
  course: AdminCourseList_Course;
}> = (props) => {
  const defaultProgram = -1; // All tab
  const [currentProgramId, setCurrentProgramId] = useState(defaultProgram);
  const [alertMessage, setAlertMessage] = useState('');
  const [achievements, setAchievements] = useState([] as AchievementOptionList_AchievementOption[]);
  const achievementsRequest = useAdminQuery<AchievementOptionList, AchievementOptionListVariables>(
    ACHIEVEMENT_OPTIONS,
    {
      variables: {
        where:
          currentProgramId > -1
            ? {
                AchievementOptionCourses: {
                  Course: {
                    Program: {
                      id: { _eq: currentProgramId },
                    },
                  },
                },
              }
            : {},
      },
    }
  );

  const refetch = useCallback(() => {
    achievementsRequest.refetch();
  }, [achievementsRequest]);

  // const aOptions = [...(achievementsRequest.data?.AchievementOption || [])];

  useEffect(() => {
    const aOptions = [...(achievementsRequest.data?.AchievementOption || [])];
    setAchievements(aOptions);
  }, [achievementsRequest.data?.AchievementOption]);

  const provider: IPropsDashBoard = {
    achievementRecordTypes: props.achievementRecordTypes,
    refetchAchievementOptions: refetch,
    course: props.course,
    programID: defaultProgram,
    setProgramID: setCurrentProgramId,
    userProfile: props.userProfile,
    userId: props.userId,
    setAlertMessage,
  };

  const closeAlertDialog = useCallback(() => {
    setAlertMessage('');
  }, [setAlertMessage]);
  return (
    <AchievementsHelper context={provider}>
      {alertMessage.trim().length > 0 && (
        <AlertMessageDialog
          alert={alertMessage}
          confirmationText={'OK'}
          onClose={closeAlertDialog}
          open={alertMessage.trim().length > 0}
        />
      )}
      <DashboardContent options={achievements} />
    </AchievementsHelper>
  );
};

export default ManageAchievementOptionsContent;

// Start Content

interface IPropsContent {
  options: AchievementOptionList_AchievementOption[];
}
const DashboardContent: FC<IPropsContent> = ({ options }) => {
  const context = useContext(AchievementContext);
  const [programs, setPrograms] = useState([] as Programs_Program[]);

  const [showNewAchievementView, setShowNewAchievementView] = useState(false);
  const onProgramFilterChange = useCallback(
    (menu: StaticComponentProperty) => {
      context.setProgramID(menu.key);
    },
    [context]
  );

  const onSuccessAddEdit = useCallback(
    (success: boolean) => {
      if (success && context.refetchAchievementOptions) {
        context.refetchAchievementOptions();
      }
      setShowNewAchievementView(false);
    },
    [context, setShowNewAchievementView]
  );

  const programsRequest = useAdminQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES);

  if (programsRequest.error) {
    console.log(programsRequest.error);
  }
  if (programsRequest.loading) {
    <CircularProgress />;
  }

  useEffect(() => {
    const p = [...(programsRequest?.data?.Program || [])];
    setPrograms(p);
  }, [programsRequest?.data?.Program]);

  const addNewAchievement = useCallback(() => {
    setShowNewAchievementView(!showNewAchievementView);
  }, [setShowNewAchievementView, showNewAchievementView]);
  const { t } = useTranslation('course-page');
  return (
    <div className="w-full">
      <div className="flex justify-between mb-5">
        {!programsRequest.loading && !programsRequest.error && (
          <ProgramsMenubar
            programs={programs}
            defaultProgramId={context.programID}
            onTabClicked={onProgramFilterChange}
          />
        )}
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex justify-start mt-8  text-white">
          <Button onClick={addNewAchievement} startIcon={<MdAddCircle />} color="inherit">
            {t('common:project-new-button')}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-5 pl-5">
          <p>{t('tableHeaderTitle')}</p>
          <p>{t('tableHeaderInstructor')}</p>
          <p>{t('coursesHeadline') + ' & ' + t('tableHeaderProgram')}</p>
        </div>
        {(options.length === 0 || showNewAchievementView) && (
          <div className="flex bg-edu-light-gray">{<AddAchievementOption onSuccess={onSuccessAddEdit} />}</div>
        )}
        <div className="flex flex-col space-y-1">
          {options.map((ac: AchievementOptionList_AchievementOption, index) => (
            <AchievementRow key={`list-data-${index}`} item={ac} />
          ))}
        </div>

        {context.achievementRecordTypes.length > 0 && (
          <div className="flex justify-end">
             <AddButton onClick={addNewAchievement} title={context.t('add-new')}/>
          </div>
        )}
      </div>
    </div>
  );
};

// Start AchievementRow
interface IPropsForARow {
  item: AchievementOptionList_AchievementOption;
}
const AchievementRow: FC<IPropsForARow> = (props) => {
  const [showDetails, setShowDetails] = useState(false);
  const context = useContext(AchievementContext);

  const handleArrowClick = useCallback(() => {
    setShowDetails((previous) => !previous);
  }, [setShowDetails]);

  const onSuccessAddEdit = useCallback(
    (success: boolean) => {
      if (success && context.refetchAchievementOptions) {
        context.refetchAchievementOptions();
        setShowDetails(false);
      }
    },
    [context, setShowDetails]
  );

  const deleteThisEntry = useCallback(async () => {
    const response = await context.onClickDeleteAnAchievement(props.item.id);
    if (response) onSuccessAddEdit(true);
  }, [context, onSuccessAddEdit, props.item.id]);
  return (
    <>
      <div className="grid grid-cols-3 gap-5 pl-5 bg-edu-row-color py-2 items-center">
        <p className="text-ellipsis text-gray-400 font-medium grid grid-cols-1">{props.item.title}</p>
        {/* Authors */}
        <div className="flex items-center flex-wrap gap-2">
          {props.item.AchievementOptionMentors.map((men, index) => (
            <div key={`mentor-${index}`} className="grid grid-cols-1">
              <EhTag
                tag={{
                  display: makeFullName(men.User.firstName, men.User.lastName),
                  id: men.id,
                }}
              />
            </div>
          ))}
        </div>
        {/* Programs and buttons */}
        <div id="course-programs-buttons" className="flex justify-between gap-5">
          <div id="course-programs" className="flex flex-wrap items-center gap-2">
            {props.item.AchievementOptionCourses.map((c, index) => (
              <div key={`view-course-${index}`} className="grid grid-cols-1">
                <TagWithTwoText
                  textLeft={c.Course.title}
                  textRight={c.Course.Program?.shortTitle}
                  textClickLink={`/manage/course/${c.courseId}`}
                />
              </div>
            ))}
          </div>
          <div id="buttons" className="flex justify-between">
            <button
              id={`expand-button-${props.item.id}`}
              className="focus:ring-2 rounded-md focus:outline-none"
              role="button"
              aria-label="option"
            >
              {showDetails ? (
                <MdKeyboardArrowUp size={26} onClick={handleArrowClick} />
              ) : (
                <MdKeyboardArrowDown size={26} onClick={handleArrowClick} />
              )}
            </button>
            <IconButton id={`delete-button-${props.item.id}`} onClick={deleteThisEntry} size="small">
              <MdDelete />
            </IconButton>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="bg-edu-light-gray">
          {<EditAchievementOption achievementOption={props.item} onSuccess={onSuccessAddEdit} />}
        </div>
      )}
    </>
  );
};
