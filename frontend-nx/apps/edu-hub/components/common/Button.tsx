import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC, ReactNode, MouseEventHandler } from 'react';
import Link, { LinkProps } from 'next/link';

type Props =
  | ({
      as: 'a';
      className?: string;
      filled?: boolean;
      inverted?: boolean;
      children?: ReactNode;
      onClick?: MouseEventHandler<HTMLAnchorElement>;
    } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({
      as: 'link';
      className?: string;
      filled?: boolean;
      inverted?: boolean;
      children?: ReactNode;
      onClick?: MouseEventHandler<HTMLAnchorElement>;
    } & LinkProps)
  | ({
      as?: 'button';
      className?: string;
      filled?: boolean;
      inverted?: boolean;
      onClick?: MouseEventHandler<HTMLButtonElement>;
      children?: ReactNode;
    } & ButtonHTMLAttributes<HTMLButtonElement>);

export const Button: FC<Props> = ({ as = 'button', className, filled, inverted, children, onClick, ...rest }) => {
  const colors = filled ? (inverted ? 'text-edu-black bg-white' : 'bg-edu-black text-white') : 'text-edu-black';

  const combinedClassName = `px-6 py-2 border-2 border-edu-black rounded-full items-center cursor-pointer select-none ${colors} ${
    className ? className : ''
  }`;

  if (as === 'a') {
    return (
      <a
        className={combinedClassName}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  if (as === 'link') {
    return (
      <Link className={combinedClassName} {...(rest as LinkProps)}>
        <a onClick={onClick as MouseEventHandler<HTMLAnchorElement>}>{children}</a>
      </Link>
    );
  }

  return (
    <button
      className={`${combinedClassName} disabled:bg-gray-400 disabled:text-zinc-500`}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
};
