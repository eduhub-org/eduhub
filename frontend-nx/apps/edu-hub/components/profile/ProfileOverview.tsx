import { FC, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
} from 'react-hook-form';
import { useSession } from 'next-auth/react';

import { Button } from '../common/Button';

import { useAuthedMutation } from '../../hooks/authedMutation';
import { useAuthedQuery } from '../../hooks/authedQuery';
import { UPDATE_USER } from '../../queries/updateUser';
import { USER } from '../../queries/user';
import useTranslation from 'next-translate/useTranslation';

import {
  updateUserVariables,
  updateUser,
} from '../../queries/__generated__/updateUser';
import { University_enum } from '../../__generated__/globalTypes';
import { Employment_enum } from '../../__generated__/globalTypes';

// generated types must be updated first with new fields in schema
// import type { User } from "../../queries/__generated__/User";

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  employment: Employment_enum | null;
  university: University_enum | null;
  matriculationNumber: string;
  externalProfile: string;
  password: string;
};

type FormFieldRowProps = {
  label: string;
  name:
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'employment'
    | 'university'
    | 'matriculationNumber'
    | 'externalProfile';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  type?: 'text' | 'email' | 'select' | 'textarea';
} & InputHTMLAttributes<HTMLInputElement> &
  SelectHTMLAttributes<HTMLSelectElement>;

const FormFieldRow: FC<FormFieldRowProps> = ({
  label,
  name,
  options,
  placeholder,
  required = false,
  type = 'text',
  ...rest
}) => {
  const {
    formState: { errors },
    register,
  } = useFormContext();

  const { t } = useTranslation();

  return (
    <div className="relative">
      <label
        htmlFor={name}
        className="text-xs uppercase tracking-widest font-medium text-gray-400"
      >
        {label}
      </label>
      {(type === 'text' || type === 'email') && (
        <input
          id={name}
          type={type}
          placeholder={placeholder || label}
          {...register(name, { required })}
          className="bg-edu-light-gray p-4 mb-5 w-full block"
          aria-invalid={errors[name] ? 'true' : 'false'}
          {...rest}
        />
      )}
      {type === 'select' && options && (
        <select
          id={name}
          placeholder={placeholder || label}
          {...register(name, { required })}
          className="bg-edu-light-gray p-4 mb-5 w-full block"
          aria-invalid={errors[name] ? 'true' : 'false'}
          {...rest}
        >
          <option value="" disabled selected hidden>
            {t('form-select-placeholder')}
          </option>
          {options.map((option, i) => (
            <option value={option.value} key={`formoption-${i}`}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {errors[name] && (
        <div className="text-edu-red absolute top-full left-0" role="alert">
          This field is required
        </div>
      )}
    </div>
  );
};

// interface IProps {}
const ProfileOverview: FC = () => {
  const { data: sessionData } = useSession();

  const methods = useForm<Inputs>({
    defaultValues: {
      firstName: sessionData?.profile?.given_name,
      lastName: sessionData?.profile?.family_name,
      email: sessionData?.profile?.email,
      employment: null,
      university: null,
      matriculationNumber: '',
      externalProfile: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isSubmitted, isSubmitSuccessful },
    reset,
  } = methods;

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useAuthedQuery(USER, {
    variables: {
      userId: sessionData?.profile?.sub,
    },
    onCompleted: (data) => {
      const user = data.User_by_pk;

      reset({
        firstName: sessionData?.profile?.given_name,
        lastName: sessionData?.profile?.family_name,
        email: sessionData?.profile?.email,
        employment: user.employment,
        university: user.university,
        matriculationNumber: user.matriculationNumber,
        externalProfile: user.externalProfile,
      });
    },
    skip: !sessionData,
  });

  const [updateUser] = useAuthedMutation<updateUser, updateUserVariables>(
    UPDATE_USER
  );

  const accessToken = sessionData?.accessToken;

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/account/`,
        {
          method: 'POST',
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.email,
            email: data.email,
            emailVerified: sessionData?.profile?.email_verified,
            id: sessionData?.profile?.sub,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      await updateUser({
        variables: {
          userId: sessionData?.profile?.sub,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          matriculationNumber: data.matriculationNumber,
          university: data.university,
          externalProfile: data.externalProfile,
          employment: data.employment,
        },
      });
      // const json = await res.json();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(error);
    }
  };
  const { t } = useTranslation();

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

  return (
    <div className="px-3 mt-6">
      {!userLoading && !userError ? (
        <>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormFieldRow label={t('first-name')} name="firstName" required />
              <FormFieldRow label={t('last-name')} name="lastName" required />
              <FormFieldRow
                label={t('email')}
                name="email"
                placeholder="name@example.com"
                required
                type="email"
              />
              <FormFieldRow
                label={t('status')}
                name="employment"
                type="select"
                options={employmentSelectFormOptions}
              />
              <FormFieldRow
                label={t('university')}
                name="university"
                type="select"
                options={universitySelectFormOptions}
              />
              <FormFieldRow
                label={t('matriculation-number')}
                name="matriculationNumber"
              />
              <FormFieldRow
                label={t('external-profile')}
                name="externalProfile"
              />
              <Button
                as="button"
                type="submit"
                disabled={isSubmitting}
                filled
                inverted
                className="block mx-auto mb-5 disabled:bg-slate-500"
              >
                {isSubmitting ? 'speichert...' : 'speichern'}
              </Button>
            </form>
          </FormProvider>
          <Button
            as="a"
            href={`${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/login-actions/reset-credentials?client_id=account-console`}
            target="_blank"
            filled
            inverted
          >
            {t('change-password')}
          </Button>
        </>
      ) : (
        <div>Loading</div>
      )}
    </div>
  );
};

export default ProfileOverview;
