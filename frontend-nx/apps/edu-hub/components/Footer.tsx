import Image from "next/image";
import { FC } from "react";

import facebookIcon from "../public/images/share/facebook-icon.svg";
import instagramIcon from "../public/images/share/instagram-icon.svg";

export const Footer: FC = () => {
  return (
    <footer className="mt-7 sm:mt-20 bg-[#0F0F0F] text-white">
      <div className="flex flex-col w-full p-6 xl:px-0 max-w-screen-xl mx-auto">
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
            <a
              href="https://www.instagram.com/opencampus_sh/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-center">
                <Image
                  src={instagramIcon}
                  alt="Instagram"
                  width={23}
                  height={23}
                />
              </div>
            </a>
            <a
              href="https://de-de.facebook.com/opencampus.sh/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="ml-6 sm:ml-20 sm:mr-10 flex items-center">
                <Image
                  src={facebookIcon}
                  alt="Facebook"
                  width={23}
                  height={23}
                />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
