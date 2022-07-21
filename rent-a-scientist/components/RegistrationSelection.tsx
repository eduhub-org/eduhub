import { Button } from "@material-ui/core";
import { FC, useCallback, useMemo } from "react";

import { AllScientistOffers_ScientistOffer } from "../queries/__generated__/AllScientistOffers";

interface IProps {
  selectedOffers?: AllScientistOffers_ScientistOffer[];
  maximumSelections?: number;
  onClickRegister?: (offers: AllScientistOffers_ScientistOffer[]) => any;
  onClickRemove?: (offer: AllScientistOffers_ScientistOffer) => any;
  className?: string
}

interface RegLineProps {
  offer: AllScientistOffers_ScientistOffer,
  onClickRemove?: (offer: AllScientistOffers_ScientistOffer) => any,
}

export const RegistrationLine: FC<RegLineProps> = ({
  offer,
  onClickRemove,
}) => {
  const handleRemove = useCallback(() => {
    if (onClickRemove) {
      onClickRemove(offer);
    }
  }, [onClickRemove, offer]);

  return <div title={offer.description} className="w-full truncate">
    <span onClick={handleRemove} className="text-red-600 cursor-pointer" title="Entfernen">X</span> {" -"} {offer.title}
  </div>
}

export const RegistrationSelection: FC<IProps> = ({
  selectedOffers,
  maximumSelections,
  onClickRegister,
  onClickRemove,
  className
}) => {

  const offers = useMemo(() => {
    return selectedOffers || [];
  }, [selectedOffers]);

  const maxiSelections = useMemo(() => {
    return maximumSelections || 5;
  }, [maximumSelections]);

  const canNotRegister = useMemo(() => {
    return offers.length > maxiSelections || offers.length === 0;
  }, [offers, maxiSelections]);

  const handleRegister = useCallback(() => {

    if (onClickRegister) {
      onClickRegister(offers);
    }

  }, [onClickRegister, offers]);

  const handleRemove = useCallback((offer: AllScientistOffers_ScientistOffer) => {
    if (onClickRemove) {
      onClickRemove(offer);
    }
  }, [onClickRemove]);

  return <div className={className}>
    <div>Gewählt: <span className={canNotRegister ? "text-red-600" : ""}>{offers.length} / {maxiSelections}</span> </div>

    <div className="lg:grid grid-cols-4">

      <div className="h-32 col-span-3 overflow-auto">
        {offers.map((offer) => <RegistrationLine onClickRemove={handleRemove} offer={offer} key={offer.id} />)}
      </div>

      <div className="grid-cols-1">

        <div>
          Maximal {maxiSelections} Optionen wählen.
        </div>

        <Button className="w-full" variant="outlined" disabled={canNotRegister} onClick={handleRegister}>
          Anmelden
        </Button>

      </div>


    </div>  

  </div>;
};
