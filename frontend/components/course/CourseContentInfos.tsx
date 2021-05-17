import { FC } from "react";

const learnings = [
  "Best Practices für TensorFlow, ein populäres Open-Source-Framework für maschinelles Lernen, um neuronale Netzwerke zu trainieren",
  "Umgang mit Bilddaten aus der realen Welt und Erkundung von Strategien zur Vermeidung von Overfit, einschließlich Augmentation und Drop-Out",
  "Erstellung eines Systems zur Verabeitung natürlicher Sprache",
  "Anwendung von RNNs, GRUs und LSTMs zum Training dieser Lernmodelle unter Verwendung von Text- und Zeitreihendaten",
];

const contents = [
  { from: new Date(), content: "Tolle Einführung" },
  {
    from: new Date(),
    content:
      "Hier lernt man voll die krassen Dinge und kann sich diese sogar merken",
  },
  {
    from: new Date(),
    content:
      "Hier stellt man fest, dass man sich die Dinge doch nicht merken konnte. AHAHAHA",
  },
  { from: new Date(), content: "Glückwunsch, du bist durch" },
];

export const CourseContentInfos: FC = () => {
  return (
    <div className="flex flex-1 flex-col mx-6 sm:mr-12 mb-8 sm:mb-24">
      <span className="text-3xl font-semibold mt-24 mb-9">Du wirst lernen</span>
      <ul>
        {learnings.map((learning, index) => (
          <li key={index} className="check-list mb-4">
            <span className="block text-sm sm:text-lg">{learning}</span>
          </li>
        ))}
      </ul>
      <span className="text-3xl font-semibold mt-24 mb-9">Kursinhalte</span>
      <ul>
        {contents.map(({ from, content }, index) => (
          <li key={index} className="flex mb-4">
            <div className="flex flex-col flex-shrink-0 mr-6">
              <span className="text-xs sm:text-sm font-semibold">
                {from.toLocaleDateString("default", {
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
              <span className="text-xs sm:text-sm">
                {from.toLocaleTimeString("default", {
                  hour: "numeric",
                  minute: "numeric",
                })}
              </span>
            </div>
            <span className="block text-sm sm:text-lg">{content}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
