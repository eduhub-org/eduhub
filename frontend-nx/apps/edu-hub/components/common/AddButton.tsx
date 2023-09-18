// AddButton.jsx
import React from 'react';
import { MdAddCircle } from 'react-icons/md';
import { Button } from './Button';
import useTranslation from 'next-translate/useTranslation';



const AddButton = ({ title = "Add Participants", onClick, translationNamespace, ...rest }) => {
  
  const { t } = useTranslation(translationNamespace);

  return (
    <Button filled onClick={onClick} {...rest}>
      <div className="flex items-center">
        <MdAddCircle className="mr-2"/>
        {t(title)}
      </div>
    </Button>
  );
};

export default AddButton;
