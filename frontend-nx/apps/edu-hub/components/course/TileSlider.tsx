import { FC } from 'react';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { v4 as uuidv4 } from 'uuid';

import 'swiper/css';

import { CourseList_Course } from '../../queries/__generated__/CourseList';

import { Tile } from './Tile';

import sliderNextArrow from '../../public/images/common/slider-next-arrow.svg';
import sliderPreviousArrow from "../../public/images/common/slider-previous-arrow.svg";

interface IProps {
  courses: CourseList_Course[];
}

const breakpoints = {
  460: {
    spaceBetween: 11,
    slidesOffsetBefore: 13,
    slidesOffsetAfter: 13,
  },
  640: {
    spaceBetween: 11,
    slidesOffsetBefore: 13,
    slidesOffsetAfter: 13,
  },
  768: {
    spaceBetween: 11,
    slidesOffsetBefore: 13,
    slidesOffsetAfter: 13,
  },
  1024: {
    spaceBetween: 11,
    slidesOffsetBefore: 13,
    slidesOffsetAfter: 13,
  },
  1280: {
    spaceBetween: 11,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,
  },
  1536: {
    spaceBetween: 11,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,
  },
};

export const TileSlider: FC<IProps> = ({ courses }) => {
  const nextButtonId = uuidv4();
  const prevButtonId = uuidv4();
  return (
    <div className="relative h-[431px]">
      <Swiper
        modules={[Navigation]}
        breakpoints={breakpoints}
        spaceBetween={11}
        slidesPerView={'auto'}
        slidesOffsetBefore={13}
        slidesOffsetAfter={13}
        onSlideChange={() => console.log('slide change')}
        onSwiper={(swiper) => console.log(swiper)}
        navigation={{
          nextEl: `.button-next-${nextButtonId}`,
          prevEl: `.button-prev-${prevButtonId}`,
        }}
      >
        {courses.map((course) => (
          <SwiperSlide
            key={`${course.id}`}
            className="whitespace-normal !h-[431px] !w-[275px] xs:!w-[325px]"
          >
            <Tile course={course} />
          </SwiperSlide>
        ))}
      </Swiper>
      {courses.length > 1 && (
        <>
          <button
            className={`button-prev-${prevButtonId} w-24 h-[431px] bg-opacity-80 bg-black flex flex-col justify-center items-center absolute top-0 left-0 z-10 rounded-tr-2xl rounded-br-2xl`}
          >
            <img className="block" src={sliderPreviousArrow} alt="blah" />
          </button>
          <button
            className={`button-next-${nextButtonId} w-24 h-[431px] bg-opacity-80 bg-black flex flex-col justify-center items-center absolute top-0 right-0 z-10 rounded-tl-2xl rounded-bl-2xl`}
          >
            <img className="block" src={sliderNextArrow} alt="blah" />
          </button>
        </>
      )}
    </div>
  );
};
