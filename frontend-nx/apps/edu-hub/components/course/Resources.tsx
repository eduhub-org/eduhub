import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { BlockTitle } from "@opencampus/shared-components";

interface IProps {
  course: Course_Course_by_pk;
}

export const Resources: FC<IProps> = ({ course }) => {
  return (
    <>
      <BlockTitle>Resources</BlockTitle>
    </>
  );
};
