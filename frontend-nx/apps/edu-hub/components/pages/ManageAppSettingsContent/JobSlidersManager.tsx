import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Close } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';

import { Button } from '../../common/Button';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { JobPostingType_enum } from '../../../__generated__/globalTypes';
import {
  ADMIN_JOB_SLIDERS,
  ADMIN_JOB_SLIDER_SOURCES,
  INSERT_JOB_SLIDER,
  DELETE_JOB_SLIDER,
  INSERT_JOB_SLIDER_JOB_TYPE,
  DELETE_JOB_SLIDER_JOB_TYPE,
} from '../../../queries/jobSlider';
import { AdminJobSliders, AdminJobSliders_CourseGroupOption } from '../../../queries/__generated__/AdminJobSliders';
import { AdminJobSliderSources } from '../../../queries/__generated__/AdminJobSliderSources';
import { InsertJobSlider, InsertJobSliderVariables } from '../../../queries/__generated__/InsertJobSlider';
import { DeleteJobSlider, DeleteJobSliderVariables } from '../../../queries/__generated__/DeleteJobSlider';
import {
  InsertJobSliderJobType,
  InsertJobSliderJobTypeVariables,
} from '../../../queries/__generated__/InsertJobSliderJobType';
import {
  DeleteJobSliderJobType,
  DeleteJobSliderJobTypeVariables,
} from '../../../queries/__generated__/DeleteJobSliderJobType';

const REFETCH = { refetchQueries: ['AdminJobSliders'] };

const JobSlidersManager: FC = () => {
  const t = useTranslations('manageAppSettings.job_sliders');
  const tJob = useTranslations('job');

  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const { data, loading, error: queryError } = useAdminQuery<AdminJobSliders>(ADMIN_JOB_SLIDERS);
  const {
    data: sourcesData,
    loading: sourcesLoading,
    error: sourcesError,
  } = useAdminQuery<AdminJobSliderSources>(ADMIN_JOB_SLIDER_SOURCES);
  const sliders = useMemo(() => data?.CourseGroupOption ?? [], [data]);
  const jobTypes = sourcesData?.JobPostingType ?? [];
  const anyLoading = loading || sourcesLoading;
  const anyError = queryError || sourcesError;
  const isReady = !anyLoading && !anyError && !!data && !!sourcesData;

  const [insertSlider] = useAdminMutation<InsertJobSlider, InsertJobSliderVariables>(INSERT_JOB_SLIDER, REFETCH);
  const [deleteSlider] = useAdminMutation<DeleteJobSlider, DeleteJobSliderVariables>(DELETE_JOB_SLIDER, REFETCH);
  const [insertJobType] = useAdminMutation<InsertJobSliderJobType, InsertJobSliderJobTypeVariables>(
    INSERT_JOB_SLIDER_JOB_TYPE,
    REFETCH
  );
  const [deleteJobType] = useAdminMutation<DeleteJobSliderJobType, DeleteJobSliderJobTypeVariables>(
    DELETE_JOB_SLIDER_JOB_TYPE,
    REFETCH
  );

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

  const handleDelete = async (slider: AdminJobSliders_CourseGroupOption) => {
    try {
      setError('');
      await deleteSlider({ variables: { id: slider.id } });
    } catch {
      setError(t('error_delete'));
    }
  };

  const toggleJobType = async (slider: AdminJobSliders_CourseGroupOption, jobType: JobPostingType_enum) => {
    const existing = slider.SelectedJobTypes.find((s) => s.jobType === jobType);
    try {
      setError('');
      if (existing) {
        await deleteJobType({ variables: { id: existing.id } });
      } else {
        await insertJobType({ variables: { jobSliderOptionId: slider.id, jobType } });
      }
    } catch {
      setError(t('error_save'));
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-label-secondary">{t('label')}</label>
      <p className="text-xs text-label-secondary mb-4">{t('help_text')}</p>

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
            const selected = new Set(slider.SelectedJobTypes.map((s) => s.jobType));
            const hasSelection = selected.size > 0;
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

                <div>
                  <div className="text-xs uppercase tracking-wide text-label-secondary mb-2">
                    {t('source_job_types')}
                  </div>
                  <div className="flex flex-col gap-1">
                    {jobTypes.map((jt) => (
                      <label key={jt.value} className="flex items-center gap-2 text-sm text-label-primary">
                        <input
                          type="checkbox"
                          checked={selected.has(jt.value as JobPostingType_enum)}
                          onChange={() => toggleJobType(slider, jt.value as JobPostingType_enum)}
                        />
                        {tJob(`type.${jt.value}`)}
                      </label>
                    ))}
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

export default JobSlidersManager;
