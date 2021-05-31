import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

const learnings = [
  "Best Practices für TensorFlow, ein populäres Open-Source-Framework für maschinelles Lernen, um neuronale Netzwerke zu trainieren",
  "Umgang mit Bilddaten aus der realen Welt und Erkundung von Strategien zur Vermeidung von Overfit, einschließlich Augmentation und Drop-Out",
  "Erstellung eines Systems zur Verabeitung natürlicher Sprache",
  "Anwendung von RNNs, GRUs und LSTMs zum Training dieser Lernmodelle unter Verwendung von Text- und Zeitreihendaten",
];

const contents = [
  { Start: new Date(), Description: "Tolle Einführung" },
  {
    Start: new Date(),
    Description:
      "Hier lernt man voll die krassen Dinge und kann sich diese sogar merken",
  },
  {
    Start: new Date(),
    Description:
      "Hier stellt man fest, dass man sich die Dinge doch nicht merken konnte. AHAHAHA",
  },
  { Start: new Date(), Description: "Glückwunsch, du bist durch" },
];

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseContentInfos: FC<IProps> = ({ course }) => {
  return (
    <div className="flex flex-1 flex-col mx-6 sm:mr-12 mb-8 sm:mb-24">
      <span className="text-3xl font-semibold mt-24 mb-9">Du wirst lernen</span>
      {/* <ul>
        {learnings.map((learning, index) => (
          <li key={index} className="check-list mb-4">
            <span className="block text-sm sm:text-lg">{learning}</span>
          </li>
        ))}
      </ul> */}
      <div dangerouslySetInnerHTML={{ __html: course.Description }} />
      <span className="text-3xl font-semibold mt-24 mb-9">Kursinhalte</span>
      <ul>
        {course.Sessions.map(({ Start, Description }, index) => (
          <li key={index} className="flex mb-4">
            <div className="flex flex-col flex-shrink-0 mr-6">
              <span className="text-xs sm:text-sm font-semibold">
                {Start.toLocaleDateString("default", {
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
              <span className="text-xs sm:text-sm">
                {Start.toLocaleTimeString("default", {
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            </div>
            <span className="block text-sm sm:text-lg">{Description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
