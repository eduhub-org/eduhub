import { FC } from "react";

import { CourseList_Course } from "../../queries/__generated__/CourseList";

import { Tile } from "./Tile";

interface IProps {
  courses: CourseList_Course[];
}

export const TileSlider: FC<IProps> = ({ courses }) => {
  return (
    <div className="w-full overflow-x-scroll">
      <div className="flex w-min whitespace-nowrap px-4 sm:px-16 xl:px-0 space-x-4">
        {courses.map((course) => (
          <div key={`${course.id}`} className="whitespace-normal">
            <Tile course={course} />
          </div>
        ))}
      </div>
    </div>
  );
};
