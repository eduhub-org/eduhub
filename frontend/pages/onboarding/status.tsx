import { FC } from "react";

import { Button } from "../../components/common/Button";

const entries = [
  "Student*in",
  "Selbstständige*r",
  "wissenschaftl. Mitarbeiter*in",
  "Angestellte*r",
  "Rentner*in",
  "Arbeitssuchende*r",
  "Sonstiges",
];

const Status: FC = () => {
  return (
    <main>
      <div className="flex h-screen justify-center items-center">
        <div className="w-[50%] px-10 pt-24 pb-16 border-2 bg-edu-black">
          <h1 className="pb-8 text-white">
            Sind deine Informationen noch aktuell?
          </h1>
          <div className="px-32">
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Vorname *"
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Nachname *"
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="E-Mail *"
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Status *"
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Hochschule *"
            />
            <input
              className="flex border-b-2 border-white bg-edu-black text-white pl-4 pb-2 pt-8 w-full"
              placeholder="Matrikelnummer / Sonstiges *"
            />
          </div>
          <div className="flex justify-center pt-24">
            <Button as="button" filled>
              Weiter
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};
// const Status: FC = () => {
//   return (
//     <main>
//       <div className="flex h-screen justify-center items-center">
//         <div className="w-[50%] p-32 border-2">
//           <h1 className="text-3xl pb-8">
//             Was beschreibt deinen Status am besten?
//           </h1>
//           <div className="flex flex-wrap">
//             {entries.map((entry) => (
//               <div key={entry} className="pr-4 py-2">
//                 <Button>{entry}</Button>
//               </div>
//             ))}
//           </div>
//           <p className="pt-6 text-[#c4c4c4]">
//             Du kannst die Angaben auch später im Profil ausfüllen und ändern.
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// };

export default Status;
