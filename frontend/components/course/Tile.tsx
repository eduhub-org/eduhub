import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

import { CourseList_Course } from "../../queries/__generated__/CourseList";

interface IProps {
  course: CourseList_Course;
}

export const Tile: FC<IProps> = ({ course }) => {
  console.log("course", course);
  return (
    <Link href={`/course/${course.Id}`}>
      <a>
        <div className="w-60 h-72 rounded-2xl overflow-hidden">
          <div className="h-1/2 bg-edu-black">
            <Image
              src={course.Image ?? "https://picsum.photos/240/144"}
              alt="Edu Hub logo"
              width={240}
              height={144}
              priority
            />
          </div>
          <div className="flex h-1/2 flex-col justify-between bg-gray-100 p-3">
            <span className="text-base">{course.Name}</span>
            <span className="text-xs uppercase">Kurs</span>
          </div>
        </div>
      </a>
    </Link>
  );
};
