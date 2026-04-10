/**
 * Visual / E2E preview for the extended-application banner on course tiles.
 * Only available when NEXT_PUBLIC_ENABLE_TILE_BANNER_PREVIEW=true (e.g. local dev).
 */
import Head from 'next/head';
import { FC } from 'react';
import { GetServerSideProps } from 'next';

import { Tile } from '../../components/common/TileSlider/Tile';
import { CourseTiles_Course } from '../../queries/__generated__/CourseTiles';
import { LocationOption_enum, Weekday_enum } from '../../__generated__/globalTypes';

type Props = { enabled: boolean };

const SAMPLE_COURSE: CourseTiles_Course = {
  __typename: 'Course',
  id: -1,
  title: 'Introduction to Web Development',
  tagline: 'In the summer semester, we focus on HTML and CSS. This beginner friendly course…',
  coverImage: null,
  language: 'EN',
  weekDay: Weekday_enum.WEDNESDAY,
  startTime: '19:00:00',
  endTime: '20:30:00',
  applicationEnd: '2099-12-31',
  published: true,
  Program: {
    __typename: 'Program',
    published: true,
    title: 'Preview Program',
    defaultApplicationEnd: '2020-01-01',
    showExtendedApplicationBanner: true,
  },
  CourseLocations: [
    {
      __typename: 'CourseLocation',
      locationOption: LocationOption_enum.KIEL,
    },
  ],
  CourseGroups: [],
};

const TileBannerPreviewPage: FC<Props> = ({ enabled }) => {
  if (!enabled) {
    return (
      <>
        <Head>
          <title>Not available</title>
        </Head>
        <p className="p-8 text-label-primary">This preview is disabled.</p>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Tile banner preview</title>
      </Head>
      <div className="p-8 bg-fill-secondary min-h-screen" data-testid="tile-banner-preview-root">
        <p className="mb-4 text-sm text-label-secondary">
          Preview only (set NEXT_PUBLIC_ENABLE_TILE_BANNER_PREVIEW=true). Switch locale with /de/… or /en/…
        </p>
        <div className="max-w-sm">
          <Tile course={SAMPLE_COURSE} isManage={false} />
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_TILE_BANNER_PREVIEW === 'true';
  return { props: { enabled } };
};

export default TileBannerPreviewPage;
