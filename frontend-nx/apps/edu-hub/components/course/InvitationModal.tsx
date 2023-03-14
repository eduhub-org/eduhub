import { FC, useState, useCallback, useEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@material-ui/core';

import { CoursePageDescriptionView } from '../../components/course/CoursePageDescriptionView';
import ModalControl from '../common/ModalController';
import { useAuthedMutation } from '../../hooks/authedMutation';
import { useAuthedQuery } from '../../hooks/authedQuery';
import { useUserId } from '../../hooks/user';
import { UPDATE_USER_ON_ENROLLMENT_CONFIRMATION } from '../../queries/updateUser';
import { USER } from '../../queries/user';
import { UPDATE_ENROLLMENT_STATUS } from '../../queries/insertEnrollment';
import { CourseWithEnrollment } from '../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../queries/courseWithEnrollment';
import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';
import { University_enum } from '../../__generated__/globalTypes';
import { Employment_enum } from '../../__generated__/globalTypes';
import {
  UpdateUserOnEnrollmentConfirmationVariables,
  UpdateUserOnEnrollmentConfirmation,
} from '../../queries/__generated__/UpdateUserOnEnrollmentConfirmation';
import {
  UpdateEnrollmentStatus,
  UpdateEnrollmentStatusVariables,
} from 'apps/edu-hub/queries/__generated__/UpdateEnrollmentStatus';
import { Button } from '../common/Button';
import FormFieldRow from '../common/forms/FormFieldRow';

type Inputs = {
  employment: Employment_enum | null;
  university: University_enum | null;
  matriculationNumber: string;
};

interface IProps {
  course: CourseWithEnrollment;
  open: boolean;
  onClose: (showModal: boolean) => void;
  resetValues?: { [key in keyof Inputs]?: string };
}

const InvitationModal: FC<IProps> = ({ course, open, onClose }) => {
  const { t } = useTranslation();
  const userId = useUserId();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: sessionData } = useSession();

  const methods = useForm<Inputs>({
    defaultValues: {
      employment: null,
      university: null,
      matriculationNumber: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = methods;

  const {
    loading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useAuthedQuery(USER, {
    variables: {
      userId: sessionData?.profile?.sub,
    },
    skip: true,
  });

  const { data: courseData, refetch: refetchCourse } =
    useAuthedQuery<CourseWithEnrollment>(COURSE_WITH_ENROLLMENT, {
      variables: {
        id,
        userId,
      },
      async onCompleted(data) {
        const enrollmentStatus =
          data?.Course_by_pk?.CourseEnrollments[0]?.status;
        if (enrollmentStatus === CourseEnrollmentStatus_enum.INVITED) {
          const userData = await refetchUser();
          const user = userData?.data?.User_by_pk;

          reset({
            employment: user.employment,
            university: user.university,
            matriculationNumber: user.matriculationNumber,
          });
          setModalOpen(true);
        }
      },
    });

  const [updateUser] = useAuthedMutation<
    UpdateUserOnEnrollmentConfirmation,
    UpdateUserOnEnrollmentConfirmationVariables
  >(UPDATE_USER_ON_ENROLLMENT_CONFIRMATION);

  const [updateEnrollmentStatus] = useAuthedMutation<
    UpdateEnrollmentStatus,
    UpdateEnrollmentStatusVariables
  >(UPDATE_ENROLLMENT_STATUS);

  const course = courseData?.Course_by_pk;

  const onCloseConfirmEnrollment = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateUser({
        variables: {
          userId: sessionData?.profile?.sub,
          matriculationNumber: data.matriculationNumber,
          university: data.university,
          employment: data.employment,
        },
      });
      const enrollmentId = courseData?.Course_by_pk?.CourseEnrollments[0]?.id;
      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: CourseEnrollmentStatus_enum.CONFIRMED,
        },
      });
      refetchCourse();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setModalOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  const onEnrollmentCancellation = async () => {
    try {
      const enrollmentId = courseData?.Course_by_pk?.CourseEnrollments[0]?.id;
      await updateEnrollmentStatus({
        variables: {
          enrollmentId,
          status: CourseEnrollmentStatus_enum.CANCELLED,
        },
      });
      refetchCourse();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setModalOpen(false);
    } catch (error) {
      console.log(error);
    }
  };

  const employmentSelectFormOptions = (
    Object.keys(Employment_enum) as Array<keyof typeof Employment_enum>
  ).map((key) => ({
    label: t(key),
    value: key,
  }));

  const universitySelectFormOptions = (
    Object.keys(University_enum) as Array<keyof typeof University_enum>
  ).map((key) => ({
    label: t(key),
    value: key,
  }));

  if (!course) {
    return <div>{t('courseNotAvailable')}</div>;
  }

  return (
      <ModalControl
        showModal={modalOpen}
        onClose={onCloseConfirmEnrollment}
        modalTitle={t('course-page:confirmationModalTitle')}
      >
        {!userLoading && !userError && (
          <>
            <div className="pb-5">
              {t('course-page:confirmationModalTextTop')}
            </div>
            <div className="pb-6">
              {t('course-page:confirmationModalTextBottom')}
            </div>
            <div>
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex flex-wrap"></div>
                  <div className="flex flex-wrap">
                    <div className="w-1/2">
                      <FormFieldRow<Inputs>
                        label={t('user-common:employmentStatus')}
                        name="employment"
                        type="select"
                        options={employmentSelectFormOptions}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap">
                    <div className="w-1/2 pr-3">
                      <FormFieldRow<Inputs>
                        label={t('user-common:university')}
                        name="university"
                        type="select"
                        options={universitySelectFormOptions}
                      />
                    </div>
                    <div className="w-1/2 pl-3">
                      <FormFieldRow<Inputs>
                        label={t('user-common:matriculationNumber')}
                        name="matriculationNumber"
                      />
                    </div>
                  </div>
                  <div className="flex">
                    <Button
                      as="button"
                      type="button"
                      disabled={isSubmitting}
                      filled
                      inverted
                      className="mt-8 block mx-auto mb-5 disabled:bg-slate-500"
                      onClick={onEnrollmentCancellation}
                    >
                      {isSubmitting ? (
                        <CircularProgress />
                      ) : (
                        t('course-page:reject')
                      )}
                    </Button>
                    <Button
                      as="button"
                      type="submit"
                      disabled={isSubmitting}
                      filled
                      className="mt-8 block mx-auto mb-5 disabled:bg-slate-500"
                    >
                      {isSubmitting ? (
                        <CircularProgress />
                      ) : (
                        t('course-page:confirm')
                      )}
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </div>
          </>
        )}
      </ModalControl>
  );
};

export default InvitationModal;
