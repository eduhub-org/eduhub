import { FC, useRef, useState } from 'react';
import { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { v4 as uuidv4 } from 'uuid';

import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';

import { CourseList_Course } from '../../../queries/__generated__/CourseList';

import { Tile } from './Tile';

import sliderNextArrow from '../../../public/images/common/slider-next-arrow.svg';
import sliderPreviousArrow from '../../../public/images/common/slider-previous-arrow.svg';

interface IProps {
  courses: CourseList_Course[];
  isManage: boolean;
}

const breakpoints = {
  460: {
    spaceBetween: 11,
    slidesOffsetBefore: 12,
    slidesOffsetAfter: 12,
  },
  640: {
    spaceBetween: 11,
    slidesOffsetBefore: 12,
    slidesOffsetAfter: 12,
  },
  768: {
    spaceBetween: 11,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,
  },
  1024: {
    spaceBetween: 11,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,
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

export const TileSlider: FC<IProps> = ({ courses, isManage }) => {
  const swiperRef = useRef(null);
  const [nextVisible, setNextVisible] = useState(true);
  const [prevVisible, setPrevVisible] = useState(false);
  const nextButtonId = uuidv4();
  const prevButtonId = uuidv4();

  const handleSlideChange = () => {
    const swiper: SwiperType = swiperRef.current.swiper;

    if (swiper.isBeginning) {
      // Hide the previous button if in start position
      setPrevVisible(false);
    } else {
      setPrevVisible(true);
    }

    if (swiper.isEnd) {
      // Hide the next button if in end position
      setNextVisible(false);
    } else {
      setNextVisible(true);
    }
  };

  const swiperPrev = () => {
    const swiper = swiperRef.current.swiper;
    swiper.slidePrev();
  };

  const swiperNext = () => {
    const swiper = swiperRef.current.swiper;
    swiper.slideNext();
  };

  return (
    <div className="relative h-[431px]">
      <Swiper
        ref={swiperRef}
        modules={[Navigation]}
        breakpoints={breakpoints}
        spaceBetween={11}
        slidesPerView={'auto'}
        slidesOffsetBefore={13}
        slidesOffsetAfter={13}
        onSlideChange={handleSlideChange}
        // navigation={{
        //   nextEl: `.button-next-${nextButtonId}`,
        //   prevEl: `.button-prev-${prevButtonId}`,
        // }}
        navigation
      >
        {courses.map((course) => (
          <SwiperSlide
            key={`${course.id}`}
            className="whitespace-normal !h-[431px] !w-[275px] xs:!w-[325px]"
          >
            <Tile course={course} isManage={isManage} />
          </SwiperSlide>
        ))}
      </Swiper>
      {courses.length > 1 && (
        <>
          <button
            className={`button-prev-${prevButtonId} w-10 h-[431px] bg-opacity-80 bg-black flex items-center justify-center absolute top-0 left-0 z-10 ${
              !prevVisible && 'hidden'
            }`}
            style={{
              background:
                'linear-gradient(0deg, rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 0.7)), linear-gradient(270deg, rgba(34, 34, 34, 0.5) 0%, rgba(255, 253, 253, 0) 105.56%)',
            }}
            onClick={swiperPrev}
          >
            <img src={sliderPreviousArrow} alt="Previous" />
          </button>
          <button
            // className={`button-next-${nextButtonId} w-24 h-[431px] bg-opacity-80 bg-black flex flex-col justify-center items-center absolute top-0 right-0 z-10 rounded-tl-2xl rounded-bl-2xl ${
            //   !nextVisible && 'hidden'
            className={`button-next-${nextButtonId} w-10 h-[431px] bg-opacity-80 bg-black flex justify-center items-center absolute top-0 right-0 z-10 ${
              !nextVisible && 'hidden'
            }`}
            style={{
              background:
                'linear-gradient(0deg, rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 0.7)), linear-gradient(270deg, rgba(34, 34, 34, 0.5) 0%, rgba(255, 253, 253, 0) 105.56%)',
            }}
            onClick={swiperNext}
          >
            <img src={sliderNextArrow} alt="next" />
          </button>
        </>
      )}
    </div>
  );
};
