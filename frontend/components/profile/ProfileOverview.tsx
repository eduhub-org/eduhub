import { useState, useEffect, FC, InputHTMLAttributes } from "react";
import { useForm, SubmitHandler, UseFormRegister } from "react-hook-form";
import { useSession } from "next-auth/react";

import {Button} from "../common/Button";

type Inputs = {
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  school: string;
  studentNumber: string;
  externalLink: string;
  password: string;
};

type InputRowProps = {
  label: string;
  name:
    | "firstName"
    | "lastName"
    | "email"
    | "status"
    | "school"
    | "studentNumber"
    | "externalLink"
    | "password";
  placeholder?: string;
  required?: boolean;
  register: UseFormRegister<Inputs>;
} & InputHTMLAttributes<HTMLInputElement>

const InputRow: FC<InputRowProps> = ({ label, name, placeholder, required, register, ...rest }) => {
  return (
    <>
      <label htmlFor={name} className="text-xs uppercase tracking-widest font-medium">
        {label}
      </label>
      <input
        id={name}
        type="text"
        placeholder={placeholder}
        {...register(name, { required: required })}
        className="bg-edu-light-gray p-4 mb-5 w-full block"
        {...rest}
      />
    </>
  );
};

// interface IProps {}
const ProfileOverview: FC = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();

  const {data} = useSession();

  const accessToken = data?.accessToken;

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const res = await fetch(
        "http://localhost:28080/realms/edu-hub/account/",
        {
          method: "POST",
          body: JSON.stringify({
            firstName: data.firstName,
            username: "abdul@mraz.biz",
            email: "abdul@mraz.biz",
            id: "540aeac7-5c30-4328-9bc3-76cbea418c1e",
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const json = await res.json();
      console.log(JSON.parse(json))
    } catch (error) {
      console.log(error);
    }
  };

  console.log(watch("firstName"));

  return (
    <div className="px-3">
      <h1>Vorname</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="">
        <InputRow
          label="Vorname"
          name="firstName"
          placeholder="Vorname"
          required
          register={register}
        />
        <InputRow
          label="Nachname"
          name="lastName"
          required
          register={register}
        />
        <InputRow label="E-Mail" name="email" required register={register} />
        <InputRow label="Status" name="status" required register={register} />
        <InputRow
          label="Hochschule"
          name="school"
          required
          register={register}
        />
        <InputRow
          label="Matrikel&shy;nummer"
          name="studentNumber"
          register={register}
        />
        <InputRow
          label="Externer Link"
          name="externalLink"
          register={register}
        />
        <InputRow
          label="Passwort"
          name="password"
          register={register}
        />
        <Button as="button" type="submit" className="block mx-auto mb-5">
          speichern
        </Button>
      </form>
    </div>
  );
};

export default ProfileOverview;
