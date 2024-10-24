import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC, ReactNode, MouseEventHandler } from 'react';
import Link, { LinkProps } from 'next/link';


interface BaseButtonProps {
  className?: string;
  filled?: boolean;
  inverted?: boolean;
  children?: ReactNode;
  buttonText?: string;
  disabled?: boolean;
}

type ButtonProps =
  | ({
      as: 'a';
      onClick?: MouseEventHandler<HTMLAnchorElement>;
    } & BaseButtonProps &
      AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({
      as: 'link';
      onClick?: MouseEventHandler<HTMLAnchorElement>;
    } & BaseButtonProps &
      LinkProps)
  | ({
      as?: 'button';
      onClick?: MouseEventHandler<HTMLButtonElement> | (() => void);
    } & BaseButtonProps &
      ButtonHTMLAttributes<HTMLButtonElement>);

export const Button: FC<ButtonProps> = ({
  as = 'button',
  className,
  filled,
  inverted,
  children,
  buttonText,
  onClick,
  disabled,
  ...rest
}) => {
  // Basis-Styling
  const baseStyles = 
    "rounded-full py-2 px-4 border-2 border-black hover:border-indigo-300 select-none";
  
  // Bedingte Styling-Klassen
  const colorStyles = filled
    ? inverted
      ? 'text-edu-black bg-white'
      : 'bg-edu-black text-white'
    : 'text-edu-black';


  const disabledStyles = 'disabled:bg-gray-400 disabled:text-zinc-500';


  const combinedClassName = `${baseStyles} ${colorStyles} ${disabledStyles} ${className || ''}`;


  const content = buttonText || children;

  const handleClick = (e: any) => {
    if (onClick) {
      if (typeof onClick === 'function') {
        onClick(e);
      }
    }
  };

  if (as === 'a') {
    return (
      <a
        className={combinedClassName}
        onClick={handleClick as MouseEventHandler<HTMLAnchorElement>}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  if (as === 'link') {
    return (
      <Link className={combinedClassName} {...(rest as LinkProps)}>
        <a onClick={handleClick as MouseEventHandler<HTMLAnchorElement>}>{content}</a>
      </Link>
    );
  }

  return (
    <button
      className={combinedClassName}
      onClick={handleClick}
      disabled={disabled}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
};

export default Button;