import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { BlockTitle } from "../common/BlockTitle";
import { Button } from "../common/Button";

interface IProps {
  course: Course_Course_by_pk;
}

export const Tasks: FC<IProps> = ({ course }) => {
  return (
    <div className="flex flex-col">
      <BlockTitle>Tasks</BlockTitle>
      <span className="text-lg mt-4">
        Um ein Leistungszertifikat für diesen Kurs zu erwerben, musst du
        zusätzlich zur ausreichenden Teilnahme einen der angebotenen
        Leistungsnachweise erbringen. Diesen musst du bis spätestens zum
        16.02.2021 hochgeladen haben.
      </span>
      <div className="flex mt-10 mb-4">
        <Button>Wähle dein Projekt ↓</Button>
      </div>
      <div className="flex">
        <Button filled>↑ Nachweis hochladen</Button>
      </div>
    </div>
  );
};
