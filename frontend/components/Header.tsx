import Image from "next/image";
import { FC } from "react";

import { LoginButton } from "./LoginButton";
import { RegisterButton } from "./RegisterButton";

export const Header: FC = () => {
  return (
    <header
      style={{
        width: "100%",
        display: "flex",
        padding: "16px 0",
        // borderStyle: "solid",
      }}
    >
      <div
        style={{
          width: "100%",
          // borderStyle: "solid",
          flex: 1,
          flexDirection: "row",
          display: "flex",
        }}
      >
        <div>
          <Image
            src="/images/edu_logo.svg"
            alt="Edu Hub logo"
            width={34}
            height={34}
            priority
          />
        </div>
        <div style={{ marginLeft: 12 }}>
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
