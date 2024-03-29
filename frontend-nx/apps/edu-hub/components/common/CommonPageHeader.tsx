import { FC } from 'react';

interface IProps {
  headline: string;
}
const CommonPageHeader: FC<IProps> = ({ headline }) => {
  return (
    <div className="py-10">
      <p className="text-base sm:text-lg lg:text-3xl leading-normal text-white mt-10">
        {headline}
      </p>
    </div>
  );
};

export default CommonPageHeader;
