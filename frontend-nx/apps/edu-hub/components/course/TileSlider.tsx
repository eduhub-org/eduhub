import { FC } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';

import { CourseList_Course } from '../../queries/__generated__/CourseList';

import { Tile } from './Tile';

interface IProps {
  courses: CourseList_Course[];
}

export const TileSlider: FC<IProps> = ({ courses }) => {
  return (
    <Swiper
      spaceBetween={50}
      slidesPerView={3}
      onSlideChange={() => console.log('slide change')}
      onSwiper={(swiper) => console.log(swiper)}
    >
      {courses.map((course) => (
        <SwiperSlide key={`${course.id}`} className="whitespace-normal">
          <Tile course={course} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
