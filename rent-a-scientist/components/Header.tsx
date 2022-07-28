import { useQuery } from "@apollo/client";
import Image from "next/image";
import Link from "next/link";
import { FC, useMemo } from "react";

import header from "../public/static/header.jpg";
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
    <header className="relative">
      <div className="absolute bottom-5 right-5 z-50">
        <ClientOnly>
          <LoginButton></LoginButton>
        </ClientOnly>
      </div>

      <div className="absolute hidden bottom-6 z-50 right-96 lg:block">
        <span className="text-2xl text-rsa-green">
        {dateString}
        </span>
      </div>

      <div className="flex w-full items-center">
        <Link href="/">
          <div className="flex cursor-pointer">
            <div className="flex items-center">
            <Image src={header}
              alt="Rent-A-Scientist Header Logo"
              width={1280}
              height={364}
              priority />
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};

