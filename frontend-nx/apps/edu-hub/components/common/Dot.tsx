import { FC } from 'react';
import { GoPrimitiveDot } from 'react-icons/go';

interface DotProps {
  color?: string;
  size?: 'DEFAULT' | 'LARGE';
  className?: string;
  onClick?: () => void;
}

const Dot: FC<DotProps> = ({ color, size = 'DEFAULT', className, onClick }) => {
  const sz = size === 'LARGE' ? '2.5em' : '1.5em';
  return (
    <GoPrimitiveDot
      onClick={onClick}
      size={sz}
      className={`${className} inline-block`}
      style={{ color: className ? undefined : color }} // Apply color only if className is not present
    />
  );
};

export default Dot;
