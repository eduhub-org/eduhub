import React from 'react';
import { MdAddCircle } from 'react-icons/md';
import { Button } from './Button'; // Ihre benutzerdefinierte Button-Komponente

// Size Option
type ButtonSize = 'small' | 'medium' | 'large';

// Different possible props
interface AddButtonProps {
  title: string; // Made mandatory since all usages provide translated titles
  onClick: () => void;
  size?: ButtonSize;
  className?: string;
}

const AddButton: React.FC<AddButtonProps> = ({
  title,
  onClick,
  size = 'medium',
  className,
  ...rest
}) => {

  // class specific Sizes
  const sizeClasses = {
    small: 'text-sm py-1 px-2',
    medium: 'text-base py-2 px-4',
    large: 'text-lg py-3 px-6'
  };

  return (
    <Button
      filled
      onClick={onClick}
      className={`flex items-center ${sizeClasses[size]} ${className || ''}`}
      {...rest}
    >
      <MdAddCircle className="mr-2" />
      {title}
    </Button>
  );
};

export default AddButton;