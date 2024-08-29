import { FC } from 'react';
import { GoPrimitiveDot } from 'react-icons/go';
export type DotColor = 'grey' | 'lightgreen' | 'orange' | 'red' | string;

interface DotProps {
  color?: DotColor;
  size?: 'DEFAULT' | 'LARGE';
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const Dot: FC<DotProps> = ({ color, size = 'DEFAULT', className, onClick, title }) => {
  const sz = size === 'LARGE' ? '2.5em' : '1.5em';
  return (
    <GoPrimitiveDot
      onClick={onClick}
      size={sz}
      className={`${className || ''} inline-block`}
      style={{ color: color }} 
      title={title}
    />
  );
};
export const greyDot = <Dot color="grey" />;
export const greenDot = <Dot color="lightgreen" />;
export const orangeDot = <Dot color="orange" />;
export const redDot = <Dot color="red" />;

export default Dot;
