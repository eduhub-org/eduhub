import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  FC,
  ReactNode,
} from 'react';
import Link, { LinkProps } from 'next/link';

type Props =
  | ({
      as: 'a';
      className?: string;
      filled?: boolean;
      inverted?: boolean;
      children?: ReactNode;
    } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({
      as: 'link';
      className?: string;
      filled?: boolean;
      inverted?: boolean;
      children?: ReactNode;
    } & LinkProps)
  | ({
      as?: 'button';
      className?: string;
      filled?: boolean;
      inverted?: boolean;
      onClick?: () => void;
      children?: ReactNode;
    } & ButtonHTMLAttributes<HTMLButtonElement>);

export const Button: FC<Props> = (props) => {
  const colors = props.filled
    ? props.inverted
      ? 'text-edu-black bg-white'
      : 'bg-edu-black text-white'
    : 'text-edu-black';

  const combinedClassName = `${
    props.className ? `${props.className} ` : ''
  }px-6 py-2 border-2 border-edu-black rounded-full items-center cursor-pointer select-none ${colors}`;

  console.log(combinedClassName);

  if (props.as === 'a') {
    const { as,className, filled, ...rest } = props;
    return (
      <a className={combinedClassName} {...rest}>
        {props.children}
      </a>
    );
  }

  if (props.as === 'link') {
    const { as,className,  filled, ...rest } = props;
    return (
      <Link className={combinedClassName} {...rest}>
        {props.children}
      </Link>
    );
  }

  const { as, className, filled, ...rest } = props;
  return (
    <button
      className={`${combinedClassName} disabled:bg-gray-400 disabled:text-zinc-500`}
      onClick={props.onClick}
      {...rest}
    >
      {props.children}
    </button>
  );
};
