import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

import appLogo from "../public/images/logo_wzk_300x340.png";
import { Button } from "./common/Button";
import { ClientOnly } from "./common/ClientOnly";
import { OnlyLoggedIn } from "./common/OnlyLoggedIn";
import { OnlyLoggedOut } from "./common/OnlyLoggedOut";
import { LoginButton } from "./LoginButton";

export const Header: FC = () => {
  return (
    <header className="flex w-full py-4">
      <div className="flex w-full items-center">
        <Link href="/">
          <div className="flex cursor-pointer">
            <div className="flex items-center">
              <Image
                src={appLogo}
                alt="Rent-A-Scientist Logo"
                width={150}
                height={170}
                priority
              />
            </div>
          </div>
        </Link>

        <div className="flex flex-col bg-rsa-background px-3 w-full">
          <span className="flex text-4xl sm:text-6xl mt-16 sm:mt-28">
            Rent-A-Scientist
          </span>
          <div className="flex justify-center mt-4 mb-6 sm:mb-20">
            <span className="text-xl sm:text-1xl text-center">
              26. bis 30.09.2022
            </span>
          </div>
        </div>

        <ClientOnly>
          <LoginButton />
        </ClientOnly>
      </div>
    </header>
  );
};
