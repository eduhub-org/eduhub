import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

import appLogo from "../public/images/logo_wzk_300x340.png"

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
      </div>
    </header>
  );
};
