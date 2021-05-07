import Image from "next/image";
import { FC } from "react";

import { LoginButton } from "./LoginButton";
import { RegisterButton } from "./RegisterButton";

export const Header: FC = () => {
  return (
    <header className="flex w-full p-4">
      <div className="flex w-full">
        <div>
          <Image
            src="/images/edu_logo.svg"
            alt="Edu Hub logo"
            width={34}
            height={34}
            priority
          />
        </div>
        <div className="ml-2">
          <Image
            src="/images/EDU_HUB_name.svg"
            alt="Edu Hub name"
            width={46}
            height={33}
            priority
          />
        </div>
      </div>
      <LoginButton />
      <RegisterButton />
    </header>
  );
};
