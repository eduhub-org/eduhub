import { FC, useCallback } from "react";
import { RSAConfig } from "../queries/ras_config";
import { AllScientistOffers_ScientistOffer } from "../queries/__generated__/AllScientistOffers";
import { MultiDateDisplay, MultiDateSelector } from "./MultiDateDisplay";
import { ScientistAvatar } from "./ScientistAvatar";




interface TitledContentProps {
  title: string,
  content: string
}

export const TitledContent: FC<TitledContentProps> = ({
  title,
  content
}) => {
  const hasContent = content.length > 0;

  return <>
    {hasContent && <div>
      <span className="font-bold">{title + ": "}</span>
      <span>{content}</span>
    </div>}
  </>
}


interface IProps {
  offer: AllScientistOffers_ScientistOffer;
  onToggleSelectedDays?: (offer: AllScientistOffers_ScientistOffer, days: number[]) => any;
  selectedDays?: number[];
  className?: string;
  config: RSAConfig,

}

export const OfferDisplay: FC<IProps> = ({
  offer,
  onToggleSelectedDays,
  selectedDays,
  className,
  config
}) => {

  const idBase = "register-selector-offer-" + offer.id;

  const handleSelectDays = useCallback((days: number[]) => {

    if (onToggleSelectedDays) {
      onToggleSelectedDays(offer, days);
    }

  }, [onToggleSelectedDays, offer]);

  return <div className={className}>

    <div className="lg:grid lg:grid-cols-2 border-t-4 border-rsa-background min-h-[400px]">

      <div>
        {offer.ScientistOfferRelations.map((rel, idx) =>
          <ScientistAvatar
            key={rel.Scientist.id} className="mt-4 pl-2 pr-2"
            subject={offer.researchSubject || ""}
            scientist={rel.Scientist}
            logo={idx === 0 ? offer.institutionLogo : undefined} />
        )}

        <div className="mt-4 pl-5 lg:pl-0">

          <div className="font-bold text-xl mt-4 mb-4 lg:hidden">
            {offer.title}
          </div>

          <div className="bg-rsa-green text-white font-bold text-sm mt-2 mb-2 pr-2 lg:hidden">
            {offer.categories.join(", ")}
          </div>

          <TitledContent title="Unterrichtsformat" content={offer.format} />
          <TitledContent title="Klassenstufen" content={offer.minimumGrade+". bis "+offer.maximumGrade+". Klasse"}/>
          <MultiDateDisplay days={offer.possibleDays} startDate={config.start} />
          <TitledContent title="Zeitfenster" content={offer.timeWindow.join(", ")} />
          <TitledContent title="Dauer" content={offer.duration} />
          <TitledContent title="Einsatzort" content={offer.possibleLocations.join(", ")} />
          <TitledContent title="Equipment" content={offer.equipmentRequired} />
          <TitledContent title="Raumanforderungen" content={offer.roomRequirements} />
          <TitledContent title="Nötige Vorbereitung" content={offer.classPreparation} />
          <TitledContent title="Weitere Informationen" content={offer.extraComment} />

          <MultiDateSelector 
            days={offer.possibleDays}
            startDate={config.start}
            instanceId={idBase + "-instance"}
            id={idBase + "-id"}
            className="mt-4"
            selectedDays={selectedDays}
            onSelectDays={handleSelectDays}
          />

        </div>

      </div>

      <div>
        <div className="bg-rsa-green text-white font-bold pl-5 pr-5 hidden lg:block">
          {offer.categories.join(", ")}
        </div>

        <div className="pl-5 pr-5 font-bold text-xl mt-4 hidden lg:block">
          {offer.title}
        </div>

        <div className="pl-5 pr-5 mt-4">
          <span className="text-rsa-green">Kurzbeschreibung:</span>  {" "}
          {offer.description}
        </div>

      </div>

    </div>

  </div>;

};
