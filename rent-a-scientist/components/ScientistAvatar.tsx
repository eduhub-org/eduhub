import { FC } from "react";
import { AllScientistOffers_ScientistOffer_ScientistOfferRelations_Scientist } from "../queries/__generated__/AllScientistOffers";
import appLogo from "../public/images/logo_wzk_300x340.png";


interface IProps {
    scientist: AllScientistOffers_ScientistOffer_ScientistOfferRelations_Scientist,
    subject: string,
    logo?: string
    className?: string,
}

export const ScientistAvatar: FC<IProps> = ({
    scientist,
    logo,
    className,
    subject
}) => {

    return <div className={className}>

            <div className="flex">
                <img src={appLogo} width={130} height={130} className="w-[100px] h-[100px] lg:w-[140px] lg:h-[140px]" />
                <div className="pl-5">
                    {logo !== undefined &&
                        <img className="lg:h-14 h-10" src={"/static/logos/" + logo.trim() + ".png"} />
                    }

                    <div className="font-bold text-xl mt-4">
                        {`${scientist.title} ${scientist.forename} ${scientist.surname}`}
                    </div>
                    <div>
                        <span className="text-rsa-green font-bold">Fachbereich:</span>{" "}<span>{subject}</span>
                    </div>

                </div>
            </div>
    </div>



};