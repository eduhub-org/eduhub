import { FC } from "react";
import { GoPrimitiveDot } from "react-icons/go";
export type DOT_COLORS = "GREY" | "GREEN" | "ORANGE" | "RED";

interface IProps {
  color: DOT_COLORS;
  size?: "DEFAULT" | "LARGE";
  className?: string;
  onClick?: () => void;
}

export const EhDot: FC<IProps> = ({ color, size, className, onClick }) => {
  let clr = "grey";
  switch (color) {
    case "GREEN":
      clr = "lightgreen";
      break;
    case "GREY":
      clr = "grey";
      break;
    case "ORANGE":
      clr = "orange";
      break;
    case "RED":
      clr = "red";
      break;
  }

  const sz = size === "LARGE" ? "2.5em" : "1.5em";

  return (
    <GoPrimitiveDot
      onClick={onClick}
      color={clr}
      size={sz}
      className={`inline ${className || ""}`}
    />
  );
};

export const greyDot = <EhDot color="GREY" />;
export const greenDot = <EhDot color="GREEN" />;
export const orangeDot = <EhDot color="ORANGE" />;
export const redDot = <EhDot color="RED" />;
