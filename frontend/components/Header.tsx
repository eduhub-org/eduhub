import Image from "next/image";
import { FC } from "react";

import { useIsLoggedIn } from "../hooks/authentication";

import { LoginButton } from "./LoginButton";
import { RegisterButton } from "./RegisterButton";
import { OnlyDesktop } from "./common/OnlyDesktop";

export const Header: FC = () => {
  const isLoggedIn = useIsLoggedIn();

  console.log("is logged in", isLoggedIn);

  return (
    <header className="flex w-full p-4">
      <div className="flex w-full items-center">
        <div className="flex items-center">
          <Image
            src="/images/edu_logo.svg"
            alt="Edu Hub logo"
            width={34}
            height={34}
            priority
          />
        </div>
        <div className="flex items-center ml-2">
          <Image
            src="/images/EDU_HUB_name.svg"
            alt="Edu Hub name"
            width={46}
            height={33}
            priority
          />
        </div>
      </div>
      {isLoggedIn ? null : (
        <>
          <LoginButton />
          <div className="ml-3">
            <OnlyDesktop>
              <RegisterButton />
            </OnlyDesktop>
          </div>
        </>
      )}
    </header>
  );
};
