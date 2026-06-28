import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Close, DragIndicator } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';

import { Button } from '../../common/Button';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ADMIN_PROJECT_GROUP_OPTIONS,
  INSERT_PROJECT_GROUP_OPTION,
  UPDATE_PROJECT_GROUP_OPTION_ORDER,
  DELETE_PROJECT_GROUP_OPTION,
} from '../../../queries/projectGroupOptions';
import {
  AdminProjectGroupOptions,
  AdminProjectGroupOptions_ProjectGroupOption,
} from '../../../queries/__generated__/AdminProjectGroupOptions';
import {
  InsertProjectGroupOption,
  InsertProjectGroupOptionVariables,
} from '../../../queries/__generated__/InsertProjectGroupOption';
import {
  UpdateProjectGroupOptionOrder,
  UpdateProjectGroupOptionOrderVariables,
} from '../../../queries/__generated__/UpdateProjectGroupOptionOrder';
import {
  DeleteProjectGroupOption,
  DeleteProjectGroupOptionVariables,
} from '../../../queries/__generated__/DeleteProjectGroupOption';

// A group is "in use" if it tags projects OR is referenced by a project slider;
// deleting it would otherwise cascade into live slider configuration.
const connectedCount = (option: AdminProjectGroupOptions_ProjectGroupOption) =>
  (option.ProjectGroups_aggregate?.aggregate?.count ?? 0) +
  (option.ProjectSliderProjectGroups_aggregate?.aggregate?.count ?? 0);

const ProjectGroupOptionsManager: FC = () => {
  const t = useTranslations('manageAppSettings.project_groups');

  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const { data, loading, error: queryError } = useAdminQuery<AdminProjectGroupOptions>(ADMIN_PROJECT_GROUP_OPTIONS);
  const options = useMemo(() => data?.ProjectGroupOption ?? [], [data]);
  const isReady = !loading && !queryError && !!data;

  const [updateOrder] = useAdminMutation<UpdateProjectGroupOptionOrder, UpdateProjectGroupOptionOrderVariables>(
    UPDATE_PROJECT_GROUP_OPTION_ORDER
  );
  const [insertOption] = useAdminMutation<InsertProjectGroupOption, InsertProjectGroupOptionVariables>(
    INSERT_PROJECT_GROUP_OPTION,
    { refetchQueries: ['AdminProjectGroupOptions', 'AdminProjectSliderSources'] }
  );
  const [deleteOption] = useAdminMutation<DeleteProjectGroupOption, DeleteProjectGroupOptionVariables>(
    DELETE_PROJECT_GROUP_OPTION,
    { refetchQueries: ['AdminProjectGroupOptions', 'AdminProjectSliderSources'] }
  );

  const onDragEnd = async (result: DropResult) => {
    if (!isReady || !result.destination || result.source.index === result.destination.index) return;

    const reordered = Array.from(options);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    try {
      await Promise.all(
        reordered.map((item, index) =>
          updateOrder({
            variables: { id: item.id, order: index + 1 },
            optimisticResponse: {
              update_ProjectGroupOption_by_pk: { __typename: 'ProjectGroupOption', id: item.id, order: index + 1 },
            },
            update: (cache) => {
              const existing = cache.readQuery<AdminProjectGroupOptions>({ query: ADMIN_PROJECT_GROUP_OPTIONS });
              if (existing) {
                cache.writeQuery({
                  query: ADMIN_PROJECT_GROUP_OPTIONS,
                  data: { ...existing, ProjectGroupOption: reordered.map((o, i) => ({ ...o, order: i + 1 })) },
                });
              }
            },
          })
        )
      );
    } catch {
      setError(t('error_reorder'));
    }
  };

  const handleAdd = async () => {
    if (!isReady) return;
    const title = newTitle.trim();
    if (!title) return;
    if (options.some((o) => o.title.toLowerCase() === title.toLowerCase())) {
      setError(t('error_duplicate'));
      return;
    }
    const order = options.reduce((max, o) => Math.max(max, o.order), 0) + 1;
    try {
      setError('');
      await insertOption({ variables: { title, order } });
      setNewTitle('');
    } catch {
      setError(t('error_add'));
    }
  };

  const handleDelete = async (option: AdminProjectGroupOptions_ProjectGroupOption) => {
    try {
      setError('');
      await deleteOption({ variables: { id: option.id } });
    } catch {
      setError(t('error_delete'));
    }
  };

  return (
    <div className="mt-8">
      <label className="text-xs uppercase tracking-widest font-medium text-gray-400">{t('label')}</label>
      <p className="text-xs text-gray-400 mb-4">{t('help_text')}</p>

      {queryError ? (
        <p className="text-red-500 text-sm">{t('error_loading')}</p>
      ) : loading ? (
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

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="projectGroupOptionsTable">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {options.map((option, index) => {
                    const count = connectedCount(option);
                    const canDelete = count === 0;
                    return (
                      <Draggable key={option.id} draggableId={String(option.id)} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className="p-4 border border-border-primary rounded mb-2 bg-fill-primary flex justify-between items-center light"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span {...dragProvided.dragHandleProps} className="text-label-secondary cursor-grab">
                                <DragIndicator fontSize="small" />
                              </span>
                              <h2 className="text-xl font-semibold text-label-primary truncate">
                                {option.title} <span className="text-base font-normal text-label-secondary">({count})</span>
                              </h2>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-mono text-label-secondary whitespace-nowrap">
                                {t('id_label')} {option.id}
                              </span>
                              <Tooltip title={canDelete ? t('delete') : t('delete_disabled_in_use')} placement="top">
                                <span>
                                  <button
                                    type="button"
                                    aria-label={t('delete')}
                                    disabled={!canDelete}
                                    onClick={() => handleDelete(option)}
                                    className="text-label-secondary hover:text-red-500 disabled:opacity-30 disabled:hover:text-label-secondary"
                                  >
                                    <Close fontSize="small" />
                                  </button>
                                </span>
                              </Tooltip>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </div>
  );
};

export default ProjectGroupOptionsManager;
