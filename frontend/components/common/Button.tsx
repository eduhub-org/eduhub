import { AnchorHTMLAttributes, FC } from "react";

type Props =
  | ({
      as: "a";
      filled?: boolean;
    } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | {
      as?: "button";
      filled?: boolean;
      onClick?: () => void;
    };

export const Button: FC<Props> = (props) => {
  const className = `px-6 py-2 border-2 border-edu-black rounded-full items-center cursor-pointer select-none ${
    props.filled ? "bg-edu-black text-white" : "text-edu-black"
  }`;

  if (props.as === "a") {
    const { as, filled, ...rest } = props;
    return (
      <a className={className} {...rest}>
        {props.children}
      </a>
    );
  }

  return (
    <button className={className} onClick={props.onClick}>
      {props.children}
    </button>
  );
};
