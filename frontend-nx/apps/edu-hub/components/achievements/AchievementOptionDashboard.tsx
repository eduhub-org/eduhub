import { CircularProgress, IconButton } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useContext, useState } from 'react';
import {
  MdDelete,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from 'react-icons/md';
import { makeFullName } from '../../helpers/util';
import { useAdminQuery } from '../../hooks/authedQuery';
import { ACHIEVEMENT_OPTIONS } from '../../queries/achievementOption';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../queries/programList';
import {
  AchievementOptionList,
  AchievementOptionListVariables,
  AchievementOptionList_AchievementOption,
} from '../../queries/__generated__/AchievementOptionList';
import { Programs } from '../../queries/__generated__/Programs';
import { StaticComponentProperty } from '../../types/UIComponents';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import EhAddButton from '../common/EhAddButton';
import EhTag from '../common/EhTag';
import TagWithTwoText from '../common/TagWithTwoText';
import { ProgramsMenubar } from '../program/ProgramsMenubar';
import AchievementsHelper, {
  AchievementContext,
  IPropsDashBoard,
} from './AchievementsHelper';
import AddAchievementOption from './AddAchievementOption';
import EditAchievementOption from './EditAchievementOption';

const AchievementOptionDashboard: FC<IPropsDashBoard> = (props) => {
  const defaultProgram = -1; // All tab
  const [currentProgramId, setCurrentProgramId] = useState(defaultProgram);
  const [alertMessage, setAlertMessage] = useState('');

  const achievementsRequest = useAdminQuery<
    AchievementOptionList,
    AchievementOptionListVariables
  >(ACHIEVEMENT_OPTIONS, {
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
  });

  const refetch = useCallback(() => {
    achievementsRequest.refetch();
  }, [achievementsRequest]);

  const aOptions = [...(achievementsRequest.data?.AchievementOption || [])];

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
      <DashboardContent options={aOptions} />
    </AchievementsHelper>
  );
};

export default AchievementOptionDashboard;

// Start Content

interface IPropsContent {
  options: AchievementOptionList_AchievementOption[];
}
const DashboardContent: FC<IPropsContent> = ({ options }) => {
  const context = useContext(AchievementContext);
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

  const programsRequest = useAdminQuery<Programs>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES
  );

  if (programsRequest.error) {
    console.log(programsRequest.error);
  }
  if (programsRequest.loading) {
    <CircularProgress />;
  }
  const addNewAchievement = useCallback(() => {
    setShowNewAchievementView(!showNewAchievementView);
  }, [setShowNewAchievementView, showNewAchievementView]);
  const { t } = useTranslation('course-page');
  return (
    <div className="w-full">
      <div className="flex justify-between mb-5">
        {!programsRequest.loading && !programsRequest.error && (
          <ProgramsMenubar
            programs={[...(programsRequest?.data?.Program || [])]}
            defaultProgramId={context.programID}
            onTabClicked={onProgramFilterChange}
          />
        )}
      </div>
      <div className="flex flex-col space-y-1">
        <div className="flex justify-end ">
          <EhAddButton
            buttonClickCallBack={addNewAchievement}
            text={context.t('add-new')}
          />
        </div>
        <div className="grid grid-cols-3 gap-5 pl-5">
          <p>{t('tableHeaderTitle')}</p>
          <p>{t('tableHeaderInstructor')}</p>
          <p>{t('coursesHeadline') + ' & ' + t('tableHeaderProgram')}</p>
        </div>
        {(options.length === 0 || showNewAchievementView) && (
          <div className="flex bg-edu-light-gray">
            {<AddAchievementOption onSuccess={onSuccessAddEdit} />}
          </div>
        )}
        <div className="flex flex-col space-y-1">
          {options.map((ac: AchievementOptionList_AchievementOption, index) => (
            <AchievementRow key={`list-data-${index}`} item={ac} />
          ))}
        </div>

        {context.achievementRecordTypes.length > 0 && (
          <div className="flex justify-end">
            <EhAddButton
              buttonClickCallBack={addNewAchievement}
              text={context.t('add-new')}
            />
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
        <p className="text-ellipsis text-gray-700 font-medium grid grid-cols-1">
          {props.item.title}
        </p>
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
        <div
          id="course-programs-buttons"
          className="flex justify-between gap-5"
        >
          <div
            id="course-programs"
            className="flex flex-wrap items-center gap-2"
          >
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
            <IconButton
              id={`delete-button-${props.item.id}`}
              onClick={deleteThisEntry}
              size="small"
            >
              <MdDelete />
            </IconButton>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="bg-edu-light-gray">
          {
            <EditAchievementOption
              achievementOption={props.item}
              onSuccess={onSuccessAddEdit}
            />
          }
        </div>
      )}
    </>
  );
};
