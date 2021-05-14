import Image from "next/image";
import { FC } from "react";

export const Footer: FC = () => {
  return (
    <footer className="flex flex-col w-full p-6 bg-edu-black text-white">
      <h3>
        <span className="text-2xl font-medium">EDU HUB</span>
        <br />
        <span className="text-xl font-light">by opencampus</span>
      </h3>
      <div className="mt-6 sm:mt-10 mb-16 sm:mb-20 text-sm font-thin">
        <p>Impressum – Datenschutz</p>
        <p>FAQ</p>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-light">© 2010 — 2021</span>
        <div className="flex items-center">
          <div className="flex items-center">
            <Image
              src="/images/share/instagram-icon.svg"
              alt="Instagram"
              width={23}
              height={23}
            />
          </div>
          <div className="ml-6 sm:ml-20 sm:mr-10 flex items-center">
            <Image
              src="/images/share/facebook-icon.svg"
              alt="Facebook"
              width={23}
              height={23}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
