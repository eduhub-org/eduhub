import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Close } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';

import { Button } from '../../common/Button';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ADMIN_PROJECT_SLIDERS,
  ADMIN_PROJECT_SLIDER_SOURCES,
  INSERT_PROJECT_SLIDER,
  DELETE_PROJECT_SLIDER,
  INSERT_PROJECT_SLIDER_COURSE_GROUP,
  DELETE_PROJECT_SLIDER_COURSE_GROUP,
  INSERT_PROJECT_SLIDER_PROJECT_GROUP,
  DELETE_PROJECT_SLIDER_PROJECT_GROUP,
} from '../../../queries/projectSlider';
import {
  AdminProjectSliders,
  AdminProjectSliders_CourseGroupOption,
} from '../../../queries/__generated__/AdminProjectSliders';
import { AdminProjectSliderSources } from '../../../queries/__generated__/AdminProjectSliderSources';
import { InsertProjectSlider, InsertProjectSliderVariables } from '../../../queries/__generated__/InsertProjectSlider';
import { DeleteProjectSlider, DeleteProjectSliderVariables } from '../../../queries/__generated__/DeleteProjectSlider';
import {
  InsertProjectSliderCourseGroup,
  InsertProjectSliderCourseGroupVariables,
} from '../../../queries/__generated__/InsertProjectSliderCourseGroup';
import {
  DeleteProjectSliderCourseGroup,
  DeleteProjectSliderCourseGroupVariables,
} from '../../../queries/__generated__/DeleteProjectSliderCourseGroup';
import {
  InsertProjectSliderProjectGroup,
  InsertProjectSliderProjectGroupVariables,
} from '../../../queries/__generated__/InsertProjectSliderProjectGroup';
import {
  DeleteProjectSliderProjectGroup,
  DeleteProjectSliderProjectGroupVariables,
} from '../../../queries/__generated__/DeleteProjectSliderProjectGroup';

const REFETCH = { refetchQueries: ['AdminProjectSliders'] };

const ProjectSlidersManager: FC = () => {
  const t = useTranslations('manageAppSettings.project_sliders');

  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const { data, loading, error: queryError } = useAdminQuery<AdminProjectSliders>(ADMIN_PROJECT_SLIDERS);
  const {
    data: sourcesData,
    loading: sourcesLoading,
    error: sourcesError,
  } = useAdminQuery<AdminProjectSliderSources>(ADMIN_PROJECT_SLIDER_SOURCES);
  const sliders = useMemo(() => data?.CourseGroupOption ?? [], [data]);
  const courseGroups = sourcesData?.CourseGroupOption ?? [];
  const projectGroups = sourcesData?.ProjectGroupOption ?? [];
  const anyLoading = loading || sourcesLoading;
  const anyError = queryError || sourcesError;
  const isReady = !anyLoading && !anyError && !!data && !!sourcesData;

  const [insertSlider] = useAdminMutation<InsertProjectSlider, InsertProjectSliderVariables>(INSERT_PROJECT_SLIDER, REFETCH);
  const [deleteSlider] = useAdminMutation<DeleteProjectSlider, DeleteProjectSliderVariables>(DELETE_PROJECT_SLIDER, REFETCH);
  const [insertCourseGroup] = useAdminMutation<
    InsertProjectSliderCourseGroup,
    InsertProjectSliderCourseGroupVariables
  >(INSERT_PROJECT_SLIDER_COURSE_GROUP, REFETCH);
  const [deleteCourseGroup] = useAdminMutation<
    DeleteProjectSliderCourseGroup,
    DeleteProjectSliderCourseGroupVariables
  >(DELETE_PROJECT_SLIDER_COURSE_GROUP, REFETCH);
  const [insertProjectGroup] = useAdminMutation<
    InsertProjectSliderProjectGroup,
    InsertProjectSliderProjectGroupVariables
  >(INSERT_PROJECT_SLIDER_PROJECT_GROUP, REFETCH);
  const [deleteProjectGroup] = useAdminMutation<
    DeleteProjectSliderProjectGroup,
    DeleteProjectSliderProjectGroupVariables
  >(DELETE_PROJECT_SLIDER_PROJECT_GROUP, REFETCH);

  const handleAdd = async () => {
    if (!isReady) return;
    const title = newTitle.trim();
    if (!title) return;
    const order = sliders.reduce((max, s) => Math.max(max, s.order), 0) + 1;
    try {
      setError('');
      await insertSlider({ variables: { title, order } });
      setNewTitle('');
    } catch {
      setError(t('error_add'));
    }
  };

  const handleDelete = async (slider: AdminProjectSliders_CourseGroupOption) => {
    try {
      setError('');
      await deleteSlider({ variables: { id: slider.id } });
    } catch {
      setError(t('error_delete'));
    }
  };

  const toggleCourseGroup = async (slider: AdminProjectSliders_CourseGroupOption, courseGroupOptionId: number) => {
    const existing = slider.SelectedCourseGroups.find((s) => s.courseGroupOptionId === courseGroupOptionId);
    try {
      setError('');
      if (existing) {
        await deleteCourseGroup({ variables: { id: existing.id } });
      } else {
        await insertCourseGroup({ variables: { projectSliderOptionId: slider.id, courseGroupOptionId } });
      }
    } catch {
      setError(t('error_save'));
    }
  };

  const toggleProjectGroup = async (slider: AdminProjectSliders_CourseGroupOption, projectGroupOptionId: number) => {
    const existing = slider.SelectedProjectGroups.find((s) => s.projectGroupOptionId === projectGroupOptionId);
    try {
      setError('');
      if (existing) {
        await deleteProjectGroup({ variables: { id: existing.id } });
      } else {
        await insertProjectGroup({ variables: { projectSliderOptionId: slider.id, projectGroupOptionId } });
      }
    } catch {
      setError(t('error_save'));
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-gray-400">{t('label')}</label>
      <p className="text-xs text-gray-400 mb-4">{t('help_text')}</p>

      {anyError ? (
        <p className="text-red-500 text-sm">{t('error_loading')}</p>
      ) : anyLoading ? (
        <p className="text-sm text-label-secondary">{t('loading')}</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder={t('add_placeholder')}
              className="flex-1 rounded border border-border-primary bg-fill-primary text-label-primary px-3 py-2"
            />
            <Button as="button" type="button" filled inverted onClick={handleAdd} disabled={!isReady || !newTitle.trim()}>
              {t('add_button')}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          {sliders.map((slider) => {
            const selectedCourse = new Set(slider.SelectedCourseGroups.map((s) => s.courseGroupOptionId));
            const selectedProject = new Set(slider.SelectedProjectGroups.map((s) => s.projectGroupOptionId));
            const hasSelection = selectedCourse.size > 0 || selectedProject.size > 0;
            return (
              <div key={slider.id} className="p-4 border border-border-primary rounded mb-3 bg-fill-primary light">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-semibold text-label-primary truncate">{slider.title}</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-label-secondary whitespace-nowrap">
                      {t('id_label')} {slider.id}
                    </span>
                    <Tooltip title={t('delete')} placement="top">
                      <button
                        type="button"
                        aria-label={t('delete')}
                        onClick={() => handleDelete(slider)}
                        className="text-label-secondary hover:text-red-500"
                      >
                        <Close fontSize="small" />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-label-secondary mb-2">
                      {t('source_course_groups')}
                    </div>
                    <div className="flex flex-col gap-1">
                      {courseGroups.map((cg) => (
                        <label key={cg.id} className="flex items-center gap-2 text-sm text-label-primary">
                          <input
                            type="checkbox"
                            checked={selectedCourse.has(cg.id)}
                            onChange={() => toggleCourseGroup(slider, cg.id)}
                          />
                          {cg.title}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-label-secondary mb-2">
                      {t('source_project_groups')}
                    </div>
                    <div className="flex flex-col gap-1">
                      {projectGroups.map((pg) => (
                        <label key={pg.id} className="flex items-center gap-2 text-sm text-label-primary">
                          <input
                            type="checkbox"
                            checked={selectedProject.has(pg.id)}
                            onChange={() => toggleProjectGroup(slider, pg.id)}
                          />
                          {pg.title}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {!hasSelection && <p className="text-xs text-label-secondary mt-3">{t('no_selection_hint')}</p>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default ProjectSlidersManager;
