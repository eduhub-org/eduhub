import {
  FC,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
  useState,
} from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@material-ui/core';

import Modal from '../common/Modal';
import { useAuthedMutation } from '../../hooks/authedMutation';
import { useAuthedQuery } from '../../hooks/authedQuery';
import { useUserId } from '../../hooks/user';
import { UPDATE_USER_ON_ENROLLMENT_CONFIRMATION } from '../../queries/updateUser';
import { USER } from '../../queries/user';
import { UPDATE_ENROLLMENT_STATUS } from '../../queries/insertEnrollment';
import {
  CourseWithEnrollment,
  CourseWithEnrollment_Course_by_pk,
} from '../../queries/__generated__/CourseWithEnrollment';
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
} from '../../queries/__generated__/UpdateEnrollmentStatus';
import { User, UserVariables } from '../../queries/__generated__/User';
import { Button } from '../common/Button';
import FormFieldRow from '../common/forms/FormFieldRow';

import type { OperationVariables, ApolloQueryResult } from '@apollo/client';
import { Course_Course_by_pk } from '../../queries/__generated__/Course';

type Inputs = {
  employment: Employment_enum | null;
  otherUniversity?: string;
  university: University_enum | null;
  matriculationNumber: string;
};

interface InvitationModalProps {
  course: CourseWithEnrollment_Course_by_pk | Course_Course_by_pk;
  enrollmentId: number;
  open: boolean;
  refetchCourse: (
    variables?: Partial<OperationVariables>
  ) => Promise<ApolloQueryResult<CourseWithEnrollment>>;
  resetValues: { [key in keyof Inputs]?: string };
  setModalOpen: Dispatch<SetStateAction<boolean>>;
}

const InvitationModal: FC<InvitationModalProps> = ({
  course,
  enrollmentId,
  open,
  refetchCourse,
  resetValues,
  setModalOpen,
}) => {
  const { t } = useTranslation();
  const userId = useUserId();

  const methods = useForm<Inputs>({
    defaultValues: {
      employment: null,
      otherUniversity: null,
      university: null,
      matriculationNumber: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
  } = methods;

  const [universityVisible, setUniversityVisible] = useState(false);
  const [otherUniversityVisible, setOtherUniversityVisible] = useState(false);
  const [otherUniversityLabel, setOtherUniversityLabel] = useState('');
  const watchEmployment = watch('employment');
  const watchUniversity = watch('university');

  useEffect(() => {
    switch (watchEmployment) {
      case Employment_enum.STUDENT:
        setOtherUniversityLabel(
          t('user-common:otherUniversityLabel.university')
        );
        setUniversityVisible(true);

        if (watchUniversity === University_enum.OTHER) {
          setOtherUniversityVisible(true);
        } else {
          setOtherUniversityVisible(false);
        }
        break;

      case Employment_enum.OTHER:
        setOtherUniversityLabel(t('user-common:otherUniversityLabel.other'));
        setUniversityVisible(false);
        setOtherUniversityVisible(true);
        break;

      case Employment_enum.ACADEMIA:
      case Employment_enum.EMPLOYED:
        setOtherUniversityLabel(
          t('user-common:otherUniversityLabel.organization')
        );
        setUniversityVisible(false);
        setOtherUniversityVisible(true);
        break;

      default:
        setUniversityVisible(false);
        setOtherUniversityVisible(false);
        break;
    }
  }, [watchEmployment, watchUniversity, t]);

  const {
    loading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useAuthedQuery<User, UserVariables>(USER, {
    variables: {
      userId,
    },
    skip: true,
  });

  useEffect(() => {
    if (resetValues) {
      const fetchUser = async () => {
        const userQueryResult = await refetchUser();
        const user = userQueryResult?.data?.User_by_pk;
        reset({
          employment: user.employment,
          otherUniversity: user.otherUniversity,
          university: user.university,
          matriculationNumber: user.matriculationNumber,
        });
        setModalOpen(true);
      };
      fetchUser();
    }
  }, [refetchUser, resetValues, reset, setModalOpen]);

  const [updateUser] = useAuthedMutation<
    UpdateUserOnEnrollmentConfirmation,
    UpdateUserOnEnrollmentConfirmationVariables
  >(UPDATE_USER_ON_ENROLLMENT_CONFIRMATION);

  const [updateEnrollmentStatus] = useAuthedMutation<
    UpdateEnrollmentStatus,
    UpdateEnrollmentStatusVariables
  >(UPDATE_ENROLLMENT_STATUS);

  const onCloseConfirmEnrollment = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      await updateUser({
        variables: {
          userId,
          matriculationNumber: data.matriculationNumber,
          university: data.university,
          employment: data.employment,
          otherUniversity: data.otherUniversity,
        },
      });
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
    <Modal
      isOpen={open}
      close={onCloseConfirmEnrollment}
      title={t('course-page:confirmationModalTitle')}
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
                {universityVisible && (
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
                )}
                {otherUniversityVisible && (
                  <FormFieldRow<Inputs>
                    label={otherUniversityLabel}
                    name="otherUniversity"
                  />
                )}
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
    </Modal>
  );
};

export default InvitationModal;
