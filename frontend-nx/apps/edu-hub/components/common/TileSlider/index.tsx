import React, { FC, useRef, useState, memo, useEffect } from 'react';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import { CourseList_Course } from '../../../graphql/__generated__/CourseList';
import { Tile } from './Tile';

import sliderNextArrow from '../../../public/images/common/slider-next-arrow.svg';
import sliderPreviousArrow from '../../../public/images/common/slider-previous-arrow.svg';

interface TileSliderProps {
  courses: CourseList_Course[];
  isManage: boolean;
}

const LazyTile = memo(Tile);
const COMMON_SPACE_BETWEEN = 11;
const COMMON_OFFSET = 12;

const breakpoints = {
  460: { spaceBetween: COMMON_SPACE_BETWEEN, slidesOffsetBefore: COMMON_OFFSET, slidesOffsetAfter: COMMON_OFFSET },
  640: { spaceBetween: COMMON_SPACE_BETWEEN, slidesOffsetBefore: COMMON_OFFSET, slidesOffsetAfter: COMMON_OFFSET },
  768: { spaceBetween: COMMON_SPACE_BETWEEN },
  1024: { spaceBetween: COMMON_SPACE_BETWEEN },
  1280: { spaceBetween: COMMON_SPACE_BETWEEN },
  1536: { spaceBetween: COMMON_SPACE_BETWEEN },
};

const TileSlider: FC<TileSliderProps> = ({ courses, isManage }) => {
  const swiperRef = useRef(null);
  const containerRef = useRef(null);
  const [nextVisible, setNextVisible] = useState(true);
  const [prevVisible, setPrevVisible] = useState(false);
  const idSuffix = useRef(Date.now().toString()).current; // unique identifier


  const handleSlideChange = () => {
    const swiper = swiperRef.current.swiper;
    setPrevVisible(!swiper.isBeginning);
    setNextVisible(!swiper.isEnd);
    console.log('swiper.isBeginning:', swiper.isBeginning);
    console.log('swiper.isEnd:', swiper.isEnd);

  };

  const swiperPrev = () => swiperRef.current.swiper.slidePrev();
  const swiperNext = () => swiperRef.current.swiper.slideNext();

  const calculateTileWidth = () => {
    const tileWidth = window.innerWidth >= 640 ? 325 : 275; // Tile width based on breakpoint
    return tileWidth;
  };

  useEffect(() => {
    const checkIfAllTilesFit = () => {
      const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 0;
      const tileWidth = calculateTileWidth();
      const totalTileWidth = courses.length * tileWidth;
      setNextVisible(totalTileWidth > containerWidth);
    };
    checkIfAllTilesFit();
    window.addEventListener("resize", checkIfAllTilesFit);
    return () => {
      window.removeEventListener("resize", checkIfAllTilesFit);
    };
  }, [courses]);


  return (
    <div className="relative h-[431px]" ref={containerRef}>
      <Swiper
        ref={swiperRef}
        modules={[Navigation]}
        breakpoints={breakpoints}
        spaceBetween={COMMON_SPACE_BETWEEN}
        slidesPerView={'auto'}
        slidesOffsetBefore={13}
        slidesOffsetAfter={13}
        onSlideChange={handleSlideChange}
        navigation
      >
        {courses.map(course => (
          <SwiperSlide key={course.id} className="whitespace-normal !h-[431px] !w-[275px] xs:!w-[325px]">
            <LazyTile course={course} isManage={isManage} />
          </SwiperSlide>
        ))}
      </Swiper>
      {courses.length > 1 && (
        <>
          <NavButton
            idSuffix={`prev-${idSuffix}`}
            className="absolute top-0 left-0 z-10"
            visible={prevVisible}
            onClick={swiperPrev}
            imgSrc={sliderPreviousArrow}
            imgAlt="Previous"
          />
          <NavButton
            idSuffix={`next-${idSuffix}`}
            className="absolute top-0 right-0 z-10"
            visible={nextVisible}
            onClick={swiperNext}
            imgSrc={sliderNextArrow}
            imgAlt="Next"
          />
        </>
      )}
    </div>
  );};

  const NavButton = ({ idSuffix, className, visible, onClick, imgSrc, imgAlt }) => (
    <button
      id={idSuffix}
      className={`${className} w-10 h-[431px] ${!visible ? 'hidden' : ''}`}
      style={buttonStyles}
      onClick={onClick}
    >
      <img src={imgSrc} alt={imgAlt} />
    </button>
  );

const buttonStyles = {
  background: 'linear-gradient(0deg, rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 0.7)), linear-gradient(270deg, rgba(34, 34, 34, 0.5) 0%, rgba(255, 253, 253, 0) 105.56%)',
};

export default TileSlider;
