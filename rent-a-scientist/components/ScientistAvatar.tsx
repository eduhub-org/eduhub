import { FC } from "react";
import { AllScientistOffers_ScientistOffer_ScientistOfferRelations_Scientist } from "../queries/__generated__/AllScientistOffers";

interface IProps {
  scientist: AllScientistOffers_ScientistOffer_ScientistOfferRelations_Scientist;
  subject: string;
  logo?: string;
  className?: string;
}

const umlautMap: any = {
  Ü: "UE",
  Ä: "AE",
  Ö: "OE",
  ü: "ue",
  ä: "ae",
  ö: "oe",
  ß: "ss",
};

const replaceUmlaute = (str: string) => {
  return str
    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
      const big = umlautMap[a.slice(0, 1)];
      return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    })
    .replace(
      new RegExp("[" + Object.keys(umlautMap).join("|") + "]", "g"),
      (a) => umlautMap[a]
    );
};

export const ScientistAvatar: FC<IProps> = ({
  scientist,
  logo,
  className,
  subject,
}) => {
  return (
    <div className={className}>
      <div className="flex">
        <img
          src={
            "/static/pics/" +
            replaceUmlaute(
              scientist.image?.trim().toLocaleLowerCase() ||
                "99_wissenschaftzukunft"
            ) +
            ".jpg"
          }
          width={130}
          height={130}
          className="w-[100px] h-[100px] lg:w-[140px] lg:h-[140px]"
        />
        <div className="pl-5">
          {logo !== undefined && (
            <img
              className="lg:h-14 h-10"
              src={"/static/logos/" + logo.trim() + ".png"}
            />
          )}

          <div className="font-bold text-xl mt-4">
            {`${scientist.title} ${scientist.forename} ${scientist.surname}`}
          </div>
          <div>
            <span className="text-rsa-green font-bold">Fachbereich:</span>{" "}
            <span>{subject}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
