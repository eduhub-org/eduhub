import { FC, useMemo } from 'react';
import { useQuery } from '@apollo/client';

import { AuthRoles } from '../../../types/enums';
import {
  HOME_JOB_TILES_ALL,
  HOME_JOB_TILES_BY_TYPES,
} from '../../../queries/jobTile';
import { HomeJobTilesAll } from '../../../queries/__generated__/HomeJobTilesAll';
import {
  HomeJobTilesByTypes,
  HomeJobTilesByTypesVariables,
} from '../../../queries/__generated__/HomeJobTilesByTypes';
import { CourseGroupOptions_CourseGroupOption } from '../../../queries/__generated__/CourseGroupOptions';
import TileSlider from '.';
import { JobTile } from './JobTile';

interface HomeJobSliderProps {
  option: CourseGroupOptions_CourseGroupOption;
  title: string;
}

/**
 * Renders a single home job-slider row (a CourseGroupOption with
 * contentType = 'JOB'). Pulls its membership from the selected job types, or
 * all published job postings when no types are selected.
 */
const HomeJobSlider: FC<HomeJobSliderProps> = ({ option, title }) => {
  const types = useMemo(
    () => option.SelectedJobTypes.map((s) => s.jobType),
    [option.SelectedJobTypes]
  );
  const hasTypeSelection = types.length > 0;

  const { data: allData, loading: allLoading, error: allError } = useQuery<HomeJobTilesAll>(HOME_JOB_TILES_ALL, {
    context: { role: AuthRoles.anonymous },
    skip: hasTypeSelection,
  });

  const { data: typeData, loading: typeLoading, error: typeError } = useQuery<
    HomeJobTilesByTypes,
    HomeJobTilesByTypesVariables
  >(HOME_JOB_TILES_BY_TYPES, {
    variables: { types },
    context: { role: AuthRoles.anonymous },
    skip: !hasTypeSelection,
  });

  const loading = hasTypeSelection ? typeLoading : allLoading;
  const error = hasTypeSelection ? typeError : allError;
  const jobs = (hasTypeSelection ? typeData?.JobPosting : allData?.JobPosting) ?? [];

  const heading = <h2 className="text-2xl font-semibold text-left ml-3 md:ml-0">{title}</h2>;

  // Degrade gracefully on the public homepage: log the failure but don't render a
  // broken/error section to every visitor.
  if (error) {
    console.warn('HomeJobSlider failed to load jobs', error);
    return null;
  }

  if (loading) {
    return (
      <>
        {heading}
        <div className="mt-2 mb-12">
          <div className="relative h-[431px] animate-pulse bg-bg-card rounded-2xl" />
        </div>
      </>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <>
      {heading}
      <div className="mt-2 mb-12">
        <TileSlider items={jobs} renderTile={(job) => <JobTile job={job} />} />
      </div>
    </>
  );
};

export default HomeJobSlider;
