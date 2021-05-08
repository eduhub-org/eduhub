import { FC } from "react";

import { Tile } from "./Tile";

export const TileSlider: FC = () => {
  return (
    <div className="w-full overflow-x-scroll">
      <div className="flex w-min whitespace-nowrap px-4 sm:px-16 xl:px-0 space-x-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={`${i}`} className="whitespace-normal">
            <Tile />
          </div>
        ))}
      </div>
    </div>
  );
};
