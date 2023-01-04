import { FC, InputHTMLAttributes } from "react";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useSession } from "next-auth/react";

import { Button } from "../common/Button";

import { useAuthedMutation } from "../../hooks/authedMutation";
import { useAuthedQuery } from "../../hooks/authedQuery";
import { UPDATE_USER } from "../../queries/updateUser";
import { USER } from "../../queries/user";

// generated types must be updated first with new fields in schema
// import type { User } from "../../queries/__generated__/User";

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  employment: string;
  university: string;
  matriculationNumber: string;
  externalProfile: string;
  password: string;
};

type InputRowProps = {
  label: string;
  name:
    | "firstName"
    | "lastName"
    | "email"
    | "employment"
    | "university"
    | "matriculationNumber"
    | "externalProfile";
  placeholder?: string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const InputRow: FC<InputRowProps> = ({
  label,
  name,
  placeholder,
  required,
  ...rest
}) => {
  const {
    formState: { errors },
    register,
  } = useFormContext();

  return (
    <div className="relative">
      <label
        htmlFor={name}
        className="text-xs uppercase tracking-widest font-medium"
      >
        {label}
      </label>
      <input
        id={name}
        type="text"
        placeholder={placeholder || label}
        {...register(name, { required })}
        className="bg-edu-light-gray p-4 mb-6 w-full block"
        aria-invalid={errors[name] ? "true" : "false"}
        {...rest}
      />
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
      employment: "",
      university: "",
      matriculationNumber: "",
      externalProfile: "",
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

  const [updateUser] = useAuthedMutation(UPDATE_USER);

  const accessToken = sessionData?.accessToken;

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/account/`,
        {
          method: "POST",
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.email,
            email: data.email,
            emailVerified: sessionData?.profile?.email_verified,
            id: sessionData?.profile?.sub,
          }),
          headers: {
            "Content-Type": "application/json",
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
          exployment: data.employment,
        },
      });
      // const json = await res.json();
      console.log(res);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="px-3">
      <h1>Vorname</h1>
      {!userLoading && !userError ? (
        <>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="">
              <InputRow label="Vorname" name="firstName" required />
              <InputRow label="Nachname" name="lastName" required />
              <InputRow
                label="E-Mail"
                name="email"
                placeholder="name@example.com"
                required
              />
              <InputRow label="Status" name="employment" />
              <InputRow label="Hochschule" name="university" />
              <InputRow
                label="Matrikel&shy;nummer"
                name="matriculationNumber"
              />
              <InputRow label="Externer Link" name="externalProfile" />
              <Button
                as="button"
                type="submit"
                disabled={isSubmitting}
                className="block mx-auto mb-5 disabled:bg-slate-500"
              >
                {isSubmitting ? "speichert..." : "speichern"}
              </Button>
            </form>
          </FormProvider>
          <Button
            as="a"
            href={`${process.env.NEXT_PUBLIC_AUTH_URL}/realms/edu-hub/login-actions/reset-credentials?client_id=account-console`}
            target="_blank"
          >
            Passwort ändern
          </Button>
        </>
      ) : (
        <div>Loading</div>
      )}
    </div>
  );
};

export default ProfileOverview;
