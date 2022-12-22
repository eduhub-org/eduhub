import Link from "next/link";
import { FC } from "react";
import { ClientOnly } from "./common/ClientOnly";
import { OnlyAdmin } from "./common/OnlyLoggedIn";

export const Footer: FC = () => {
  return (
    <footer className="flex flex-col w-full p-6 bg-rsa-black text-white">
      <div className="flex justify-between items-center">
        <span className="text-sm font-light">©2022</span>

        <ClientOnly>
          <OnlyAdmin>
            <>
              <Link href="/matching">Matchingbereich</Link>
              <Link href="/admin">Adminbereich</Link>
            </>
          </OnlyAdmin>
        </ClientOnly>
      </div>
    </footer>
  );
};
