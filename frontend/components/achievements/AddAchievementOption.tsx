import { Checkbox } from "@material-ui/core";
import { FC, useCallback, useContext, useReducer } from "react";
import { MdAddCircle } from "react-icons/md";
import { useAdminMutation } from "../../hooks/authedMutation";
import { AchievementContext } from "../../pages/achievements";
import { INSERT_AN_ACHIEVEMENT_OPTION } from "../../queries/mutateAchievement";
import { InsertAnAchievementOption, InsertAnAchievementOptionVariables } from "../../queries/__generated__/InsertAnAchievementOption";
import { AchievementOption_set_input, AchievementRecordType_enum } from "../../__generated__/globalTypes";
import { Button } from "../common/Button";
import ExpertsDialog from "../common/dialogs/ExpertsDialog";
import EhInputWithTitle from "../common/EhInputWithTitle";
import EhSelectForEnum from "../common/EhSelectForEnum";
import TagWithTwoText from "../common/TagWithTwoText";
import { UiFileInputButton } from "../common/UiFileInputButton";
import { IAddEditAchievementTempData } from "./AddEditComponent";

interface TempAchievementOptionMentor {
  id: number; // Table ID of AchievementOptionMentor
  expertId: number;
  firstName: string;
  lastName: string;
}
interface TempAchievementOptionCourse {
  id: number; // Table ID of AchievementOptionCourse
  courseId: number;
  title: string;
  programShortName: string;
}
export interface IData extends AchievementOption_set_input {
  showMentorDialog: boolean;
  showCourseListDialog: boolean;
  documentationTemplateName: string;
  evaluationScriptName: string;
  experts: TempAchievementOptionMentor[];
  courses: TempAchievementOptionCourse[];
}

interface IProps {
  initialState: IData;
}

const AddAchievemenOption: FC<IProps> = ({ initialState }) => {
  const [insertAnAchievement] = useAdminMutation<
    InsertAnAchievementOption,
    InsertAnAchievementOptionVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION);

//   const queryInsertANewAchievementOption = useCallback(async () => {
//     try {
//       const response = await insertAnAchievement({
//         variables: {
//           data: {
//             title: state.title,
//             description: state.description,
//             /**
//              * While inserting now evaluationScriptUrl file will be uploaded. Since this field is mandatory, I have to add this file as empty string.
//              * The reason for not uploading the file is we do not have "archiveOptionId" to make the url "<archiveOptionId>/evaluation_script/file-name"
//              */
//             evaluationScriptUrl: state.evaluationScriptUrl,
//             /**
//              * While inserting now documentationTemplateUrl file will be uploaded. Since this field is "mandatory", I have to add this file as empty string.
//              * The reason for not uploading the file is we do not have "archiveOptionId" to make the url "<archiveOptionId>/documentation_template/file-name"
//              */
//             documentationTemplateUrl: state.documentationTemplateUrl,
//             recordType: state.recordType as AchievementRecordType_enum,
//             AchievementOptionCourses: {
//               data: state.courses.map((c) => ({ courseId: c.courseId })),
//             },
//             AchievementOptionMentors: {
//               data: state.experts.map((e) => ({ expertId: e.expertId })),
//             },
//           },
//         },
//       });

//       if (response.errors) {
//         console.log("Adding failed!");
//         if (props.onSuccess) props.onSuccess(false);
//       } else {
//         if (props.onSuccess) {
//           props.onSuccess(true);
//           return true;
//         }
//       }
//     } catch (error) {
//       console.log(error);
//     }
//     return false;
//   }, [state, props, insertAnAchievement]);




  const context = useContext(AchievementContext);

  const data: IAddEditAchievementTempData = {
    initialState: {
       
    } 

  }
  return (
    
  );
};

export default AddAchievemenOption;
