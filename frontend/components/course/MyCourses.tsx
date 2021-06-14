import { useQuery } from "@apollo/client";
import { FC } from "react";

import { useIsLoggedIn } from "../../hooks/authentication";
import { PARTICIPATING } from "../../queries/participating";

import { TileSlider } from "./TileSlider";

interface IProps {}

export const MyCourses: FC<IProps> = () => {
  const isLoggedIn = useIsLoggedIn();
  const { data: courses, loading, error } = useQuery(PARTICIPATING, {
    variables: { id: 12 },
  });

  console.log("c", courses);

  if (!isLoggedIn || (courses?.Course?.length ?? 0) <= 0) return null;

  return (
    <>
      <h2 className="text-3xl font-semibold text-center mt-20">Deine Kurse</h2>
      <div className="mt-11">
        <TileSlider courses={courses?.Course ?? []} />
      </div>
    </>
  );
};
