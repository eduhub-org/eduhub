import { FC } from "react";

import { useAuthedQuery } from "../../hooks/authedQuery";
import { Participating } from "../../queries/__generated__/Participating";
import { PARTICIPATING } from "../../queries/participating";
import { Button } from "../common/Button";

import { TileSlider } from "./TileSlider";

interface IProps {}

export const MyCourses: FC<IProps> = () => {
  const { data, loading, error } = useAuthedQuery<Participating>(
    PARTICIPATING,
    {
      variables: { id: 12 },
    }
  );

  const enrollments = data?.Person_by_pk?.Participants?.[0]?.Enrollments;
  const courses = enrollments?.map((enrollment) => enrollment.Course) ?? [];

  if ((courses.length ?? 0) <= 0) {
    return (
      <div className="flex flex-col space-y-10 justify-center items-center">
        <span className="text-xl font-bold">
          Du hast noch keinen Kurs mit gemacht
        </span>
        <a href="#courses">
          <Button filled>Kurse entdecken</Button>
        </a>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-semibold text-center mt-20">Deine Kurse</h2>
      <div className="mt-11">
        <TileSlider courses={courses ?? []} />
      </div>
    </>
  );
};
