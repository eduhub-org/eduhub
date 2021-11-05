/* eslint-disable react/jsx-no-bind */
import { Modal } from "@material-ui/core";
import Fade from "@material-ui/core/Fade";
import Image from "next/image";
import { FC, useCallback, useEffect, useState } from "react";

import { useAuthedMutation } from "../../hooks/authedMutation";
import { useKeycloakUserProfile, useUser, useUserId } from "../../hooks/user";
import xIcon from "../../public/images/common/x-calibur.svg";
import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { CourseWithEnrollment_Course_by_pk } from "../../queries/__generated__/CourseWithEnrollment";
import {
  InsertEnrollment,
  InsertEnrollmentVariables,
} from "../../queries/__generated__/InsertEnrollment";
import {
  InsertUser,
  InsertUserVariables,
} from "../../queries/__generated__/InsertUser";
import { INSERT_ENROLLMENT } from "../../queries/insertEnrollment";
import { INSERT_USER } from "../../queries/insertUser";
import { USER } from "../../queries/user";
import { Button } from "../common/Button";

interface IProps {
  closeModal: () => void;
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk;
  visible: boolean;
}

export const UserInfoModal: FC<IProps> = ({ closeModal, course, visible }) => {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [mail, setMail] = useState("");
  const [status, setStatus] = useState("");
  const [school, setSchool] = useState("");
  const [studentId, setStudentId] = useState("");
  const [mailEditable, setMailEditable] = useState(true);
  const userId = useUserId();
  const profile = useKeycloakUserProfile();

  const [insertUser, { data, loading, error }] = useAuthedMutation<
    InsertUser,
    InsertUserVariables
  >(INSERT_USER);

  const createUser = useCallback(() => {
    if (!userId) {
      // eslint-disable-next-line no-console
      console.log("Missing user data.");
      return;
    }

    insertUser({
      variables: {
        userId,
      },
      refetchQueries: [
        "User", // Query name
      ],
    });
  }, [userId, insertUser]);

  useEffect(() => {
    if (profile) {
      setFirstname(profile.firstName ?? "");
      setLastname(profile.lastName ?? "");
      setMail(profile.email ?? "");
      setMailEditable(!profile.email);
      // setStatus(profile.status);
      // setSchool(profile.school);
      // setStudentId(profile.studentId);
    }
  }, [profile]);

  return (
    <Modal
      open={visible}
      onClose={closeModal}
      className="flex justify-center items-center border-none"
      disableEnforceFocus
      disableBackdropClick={false}
      closeAfterTransition
    >
      <Fade in={visible}>
        <div className="w-full sm:w-auto h-full sm:h-auto sm:m-16 sm:rounded bg-edu-black p-8">
          {/* <div className="w-[50%] px-10 pt-24 pb-16 border-2 bg-edu-black"> */}
          <h1 className="pb-8 text-white">
            Bitte gib uns zunächst noch ein paar Informationen über dich.
          </h1>
          <div className="px-20">
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Vorname *"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Nachname *"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="E-Mail *"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              disabled={!mailEditable}
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Status *"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Hochschule *"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Matrikelnummer / Sonstiges *"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div className="flex justify-center pt-24">
            <Button as="button" filled onClick={createUser}>
              Weiter
            </Button>
          </div>
          {/* </div> */}
        </div>
      </Fade>
    </Modal>
  );
};
