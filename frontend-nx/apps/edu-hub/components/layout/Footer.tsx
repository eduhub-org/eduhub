import Image from 'next/image';
import { FC } from 'react';
import facebookIcon from '../../public/images/share/facebook-icon.svg';
import instagramIcon from '../../public/images/share/instagram-icon.svg';
import dlcLogo from '../../public/images/share/logo_dlc.svg';
import foerderLogo from '../../public/images/share/foerderlogos_2.svg';

export const Footer: FC = () => {
  return (
    <footer className="mt-7 sm:mt-20 bg-[#0F0F0F] text-white">
      <div className="flex flex-col w-full p-6 md:px-16 max-w-screen-xl mx-auto">
        <h3>
          <span className="text-2xl font-medium">EDU HUB</span>
          <br />
          <span className="text-xl font-light">by opencampus.sh</span>
        </h3>
        
        <div className="mt-6 sm:mt-2 flex flex-col sm:flex-row sm:justify-between relative">

          <div className="text-sm font-thin order-2 sm:order-1 mt-4 sm:mt-20">
            <p>
              <a href="/impressum" target="_blank" rel="noopener noreferrer">
                {'Impressum - Datenschutz'}
              </a>
            </p>
            <p>
              <a href="https://opencampus.gitbook.io/faq/" target="_blank" rel="noopener noreferrer">
                {'FAQ'}
              </a>
            </p>
            <p>
              <a href="https://opencampus.substack.com" target="_blank" rel="noopener noreferrer">
                {'Newsletter'}
              </a>
            </p>
          </div>
          
          <div className="flex flex-col order-1 sm:order-2 mt-8 sm:-mt-14">
            <span className="text-white text-sm font-medium tracking-wide mb-2">
              Gefördert durch:
            </span>
           
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-8 sm:gap-4 bg-white p-8 sm:p-4 rounded">
              <div className="flex items-end w-[200px] h-[80px]">
                <Image 
                  src={dlcLogo} 
                  alt="DLC Logo" 
                  width={200} 
                  height={80}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-end w-[400px] h-[80px]">
                <Image 
                  src={foerderLogo} 
                  alt="Förder Logo" 
                  width={400} 
                  height={80}
                  priority
                  unoptimized
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-8">
          <span className="text-sm font-light">© 2010 — {new Date().getFullYear()}</span>
          <div className="flex items-center">
            <a href="https://www.instagram.com/opencampus_sh/" target="_blank" rel="noopener noreferrer">
              <div className="flex items-center w-[23px] h-[23px]">
                <Image src={instagramIcon} alt="Instagram" width={23} height={23} unoptimized className="w-full h-full object-contain" />
              </div>
            </a>
            <a href="https://de-de.facebook.com/opencampus.sh/" target="_blank" rel="noopener noreferrer">
              <div className="ml-6 sm:ml-20 sm:mr-10 flex items-center w-[23px] h-[23px]">
                <Image src={facebookIcon} alt="Facebook" width={23} height={23} unoptimized className="w-full h-full object-contain" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};