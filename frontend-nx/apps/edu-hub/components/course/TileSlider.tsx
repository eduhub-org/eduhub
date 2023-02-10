import { FC } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';

import { CourseList_Course } from '../../queries/__generated__/CourseList';

import { Tile } from './Tile';

interface IProps {
  courses: CourseList_Course[];
}

const breakpoints = {
  460: {
    slidesPerView: 2.15,
    spaceBetween: 11,
  },
  640: {
    slidesPerView: 3.15,
    spaceBetween: 11,
  },
  768: {
    slidesPerView: 3.15,
    spaceBetween: 11,
  },
  1024: {
    slidesPerView: 4.33333,
    spaceBetween: 11,
  },
  1280: {
    slidesPerView: 4.33333,
    spaceBetween: 11,
  },
  1536: {
    slidesPerView: 4.33333,
    spaceBetween: 11,
  },
};

export const TileSlider: FC<IProps> = ({ courses }) => {
  return (
    <Swiper
      breakpoints={breakpoints}
      spaceBetween={11}
      slidesPerView={1.15}
      slidesOffsetBefore={13}
      slidesOffsetAfter={13}
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
