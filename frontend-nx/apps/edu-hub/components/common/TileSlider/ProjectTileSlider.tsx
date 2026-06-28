import { FC, useRef, useState, useEffect, memo } from 'react';
import { Mousewheel } from 'swiper/modules';
import { Swiper, SwiperSlide, SwiperRef } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/mousewheel';

import { ProjectTileFragment } from '../../../queries/__generated__/ProjectTileFragment';
import { ProjectTile, ProjectTileContext } from './ProjectTile';

interface ProjectTileSliderProps {
  projects: ProjectTileFragment[];
  context: ProjectTileContext;
  courseId?: number;
}

interface NavButtonProps {
  idSuffix: string;
  className: string;
  visible: boolean;
  onClick: () => void;
  imgSrc: string;
  imgAlt: string;
}

const buttonStyles = {
  background:
    'linear-gradient(0deg, rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 0.7)), linear-gradient(270deg, rgba(34, 34, 34, 0.5) 0%, rgba(255, 253, 253, 0) 105.56%)',
};

const NavButton: FC<NavButtonProps> = ({ idSuffix, className, visible, onClick, imgSrc, imgAlt }) => (
  <button
    id={idSuffix}
    className={`${className} w-10 h-[431px] ${!visible ? 'hidden' : ''}`}
    style={buttonStyles}
    onClick={onClick}
  >
    <img src={imgSrc} alt={imgAlt} />
  </button>
);

const LazyProjectTile = memo(ProjectTile);
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

const ProjectTileSlider: FC<ProjectTileSliderProps> = ({ projects, context, courseId }) => {
  const swiperRef = useRef<SwiperRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nextVisible, setNextVisible] = useState(true);
  const [prevVisible, setPrevVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const idSuffix = useRef(Date.now().toString()).current;

  const handleSlideChange = () => {
    if (swiperRef.current?.swiper) {
      const swiper = swiperRef.current.swiper;
      setPrevVisible(!swiper.isBeginning);
      setNextVisible(!swiper.isEnd);
    }
  };

  const swiperPrev = () => swiperRef.current?.swiper?.slidePrev();
  const swiperNext = () => swiperRef.current?.swiper?.slideNext();

  useEffect(() => {
    const checkIfAllTilesFit = () => {
      const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 0;
      const tileWidth = window.innerWidth >= 640 ? 325 : 275;
      setNextVisible(projects.length * tileWidth > containerWidth);
    };
    checkIfAllTilesFit();
    window.addEventListener('resize', checkIfAllTilesFit);
    return () => window.removeEventListener('resize', checkIfAllTilesFit);
  }, [projects]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!projects || projects.length === 0) {
    return <div className="relative h-[431px]" ref={containerRef} />;
  }

  if (!isClient) {
    return (
      <div className="relative h-[431px]" ref={containerRef}>
        <div className="animate-pulse bg-gray-200 h-full rounded" />
      </div>
    );
  }

  return (
    <div className="relative h-[431px]" ref={containerRef} style={{ overscrollBehaviorX: 'contain' }}>
      <Swiper
        ref={swiperRef}
        modules={[Mousewheel]}
        breakpoints={breakpoints}
        spaceBetween={COMMON_SPACE_BETWEEN}
        slidesPerView={'auto'}
        slidesOffsetBefore={13}
        slidesOffsetAfter={13}
        onSlideChange={handleSlideChange}
        mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: false }}
      >
        {projects.map((project) => (
          <SwiperSlide key={project.id} className="whitespace-normal !h-[431px] !w-[275px] xs:!w-[325px]">
            <LazyProjectTile project={project} context={context} courseId={courseId} />
          </SwiperSlide>
        ))}
      </Swiper>
      {projects.length > 1 && (
        <>
          <NavButton
            idSuffix={`project-prev-${idSuffix}`}
            className="absolute top-0 left-0 z-10"
            visible={prevVisible}
            onClick={swiperPrev}
            imgSrc="/images/common/slider-previous-arrow.svg"
            imgAlt="Previous"
          />
          <NavButton
            idSuffix={`project-next-${idSuffix}`}
            className="absolute top-0 right-0 z-10"
            visible={nextVisible}
            onClick={swiperNext}
            imgSrc="/images/common/slider-next-arrow.svg"
            imgAlt="Next"
          />
        </>
      )}
    </div>
  );
};

export default ProjectTileSlider;
