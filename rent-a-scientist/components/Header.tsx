import { useQuery } from "@apollo/client";
import Image from "next/image";
import Link from "next/link";
import { FC, useMemo } from "react";

import appLogo from "../public/images/logo_wzk_300x340.png";
import { QUERY_RSA_CONFIG } from "../queries/ras_config";
import { QueryRSAConfig } from "../queries/__generated__/QueryRSAConfig";
import { ClientOnly } from "./common/ClientOnly";
import { LoginButton } from "./LoginButton";

export const Header: FC = () => {
  const qConfig = useQuery<QueryRSAConfig>(QUERY_RSA_CONFIG);

  const p2 = (x: number) => {
    if (x < 10) return "0" + x;
    return "" + x;
}

  const dateString = useMemo(() => {

    const startDate = qConfig.data?.RentAScientistConfig_by_pk?.Program.lectureStart;
    const endDate = qConfig.data?.RentAScientistConfig_by_pk?.Program.lectureEnd;

    if (startDate && endDate) {
      if (startDate.getMonth() === endDate.getMonth()) {
        return `${p2(startDate.getDate())}. bis ${p2(endDate.getDate())}.${p2(endDate.getMonth() + 1)}.${endDate.getFullYear()}`;
      } else {
        return `${p2(startDate.getDate())}.${p2(startDate.getMonth() + 1)}. bis ${p2(endDate.getDate())}.${p2(endDate.getMonth() + 1)}.${endDate.getFullYear()}`;
      }
    } else {
      return "";
    }

  }, [qConfig]);

  return (
    <header className="flex w-full py-4">
      <div className="flex w-full items-center">
        <Link href="/">
          <div className="flex cursor-pointer">
            <div className="flex items-center">
              <Image
                src={appLogo}
                alt="Rent-A-Scientist Logo"
                width={1.5 * 150}
                height={1.5 * 170}
                priority
              />
            </div>
          </div>
        </Link>

        <div className="flex flex-col bg-rsa-green px-3 w-full xl:h-48 h-36">
          <div className="flex xl:text-4xl xl:mt-16 mt-4">
            Rent-A-Scientist
          </div>
          <div className="flex justify-center">
            <span className="text-xl text-center">
              {dateString}
            </span>
          </div>
          <div>
          <ClientOnly>
          <LoginButton />
        </ClientOnly>
          </div>
        </div>
      </div>
    </header>
  );
};
