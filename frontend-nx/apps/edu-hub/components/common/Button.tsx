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
  const baseStyles = 'rounded-full py-2 px-4 border-2 border-border-secondary hover:border-brand select-none transition-colors';

  // Bedingte Styling-Klassen
  let colorStyles = 'text-label-primary border-border-secondary hover:border-brand';
  if (filled) {
    if (inverted) {
      colorStyles = 'text-fill-primary bg-fill-secondary border-border-secondary hover:border-brand';
    } else {
      colorStyles = 'bg-label-primary text-fill-primary border-label-primary hover:border-brand-light';
    }
  }

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
      <Link
        className={combinedClassName}
        onClick={handleClick as MouseEventHandler<HTMLAnchorElement>}
        {...(rest as LinkProps)}
      >
        {content}
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
