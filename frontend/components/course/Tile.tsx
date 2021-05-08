import Image from "next/image";
import { FC } from "react";

interface IProps {}

export const Tile: FC<IProps> = () => {
  return (
    <div className="w-60 h-72 rounded-2xl overflow-hidden">
      <div className="h-1/2 bg-edu-black">
        <Image
          src="https://picsum.photos/240/144"
          alt="Edu Hub logo"
          width={240}
          height={144}
          priority
        />
      </div>
      <div className="flex h-1/2 flex-col justify-between bg-gray-100 p-3">
        <span className="text-base">
          Einführung in Data Science & maschinelles Lernen
        </span>
        <span className="text-xs uppercase">Kurs</span>
      </div>
    </div>
  );
};
