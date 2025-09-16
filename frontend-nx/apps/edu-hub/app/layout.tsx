import { ReactNode } from 'react';

import '../styles/globals.css';

type Props = {
  children: ReactNode;
};

export default function RootLayout({
  children
}: Props) {
  return (
    <html lang="de" className="font-body text-edu-black bg-edu-bg-gray">
      <head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@100;200;300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
