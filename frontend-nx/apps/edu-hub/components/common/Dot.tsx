import { FC } from 'react';
import { GoDotFill } from 'react-icons/go';
export type DotColor = 'grey' | 'lightgreen' | 'orange' | 'red';

const DOT_COLOR_MAP: Record<DotColor, string> = {
  lightgreen: 'var(--eduhub-success)',
  red: 'var(--eduhub-error)',
  orange: 'var(--eduhub-warning)',
  grey: 'var(--eduhub-label-disabled)',
};

interface DotProps {
  color?: DotColor;
  size?: 'DEFAULT' | 'LARGE';
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const Dot: FC<DotProps> = ({ color, size = 'DEFAULT', className, onClick, title }) => {
  const sz = size === 'LARGE' ? '2.5em' : '1.5em';
  const cssColor = color ? DOT_COLOR_MAP[color] : undefined;
  return (
    <GoDotFill
      onClick={onClick}
      size={sz}
      className={`${className || ''} inline-block`}
      style={cssColor ? { color: cssColor } : undefined}
      title={title}
    />
  );
};
export const greyDot = <Dot color="grey" />;
export const greenDot = <Dot color="lightgreen" />;
export const orangeDot = <Dot color="orange" />;
export const redDot = <Dot color="red" />;

export default Dot;
