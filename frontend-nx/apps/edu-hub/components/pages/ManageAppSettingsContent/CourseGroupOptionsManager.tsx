import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Close, DragIndicator } from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';

import { Button } from '../../common/Button';
import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ADMIN_COURSE_GROUP_OPTIONS,
  UPDATE_COURSE_GROUP_OPTION_ORDER,
  UPDATE_COURSE_GROUP_OPTION_SLIDER_GROUP,
  INSERT_COURSE_GROUP_OPTION,
  DELETE_COURSE_GROUP_OPTION,
} from '../../../queries/courseGroupOptions';
import {
  AdminCourseGroupOptions,
  AdminCourseGroupOptions_CourseGroupOption,
} from '../../../queries/__generated__/AdminCourseGroupOptions';
import {
  UpdateCourseGroupOptionOrder,
  UpdateCourseGroupOptionOrderVariables,
} from '../../../queries/__generated__/UpdateCourseGroupOptionOrder';
import {
  UpdateCourseGroupOptionSliderGroup,
  UpdateCourseGroupOptionSliderGroupVariables,
} from '../../../queries/__generated__/UpdateCourseGroupOptionSliderGroup';
import {
  InsertCourseGroupOption,
  InsertCourseGroupOptionVariables,
} from '../../../queries/__generated__/InsertCourseGroupOption';
import {
  DeleteCourseGroupOption,
  DeleteCourseGroupOptionVariables,
} from '../../../queries/__generated__/DeleteCourseGroupOption';

// Titles that have a translation in common.course_group_options. Custom group
// options created by an admin are shown with their raw title instead.
const KNOWN_TITLES = new Set([
  'tech_coding',
  'business_startup',
  'creative_social_sustainable',
  'degree',
  'event',
  'courses',
]);

const connectedCount = (option: AdminCourseGroupOptions_CourseGroupOption) =>
  option.CourseGroups_aggregate?.aggregate?.count ?? 0;

const CourseGroupOptionsManager: FC = () => {
  const t = useTranslations('manageAppSettings.course_groups');
  const tCommon = useTranslations('common');

  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const { data } = useAdminQuery<AdminCourseGroupOptions>(ADMIN_COURSE_GROUP_OPTIONS);
  const options = useMemo(() => data?.CourseGroupOption ?? [], [data]);

  const [updateOrder] = useAdminMutation<UpdateCourseGroupOptionOrder, UpdateCourseGroupOptionOrderVariables>(
    UPDATE_COURSE_GROUP_OPTION_ORDER
  );
  const [updateSliderGroup] = useAdminMutation<
    UpdateCourseGroupOptionSliderGroup,
    UpdateCourseGroupOptionSliderGroupVariables
  >(UPDATE_COURSE_GROUP_OPTION_SLIDER_GROUP, { refetchQueries: ['AdminCourseGroupOptions', 'CourseGroupOptions'] });
  const [insertOption] = useAdminMutation<InsertCourseGroupOption, InsertCourseGroupOptionVariables>(
    INSERT_COURSE_GROUP_OPTION,
    { refetchQueries: ['AdminCourseGroupOptions', 'CourseGroupOptions'] }
  );
  const [deleteOption] = useAdminMutation<DeleteCourseGroupOption, DeleteCourseGroupOptionVariables>(
    DELETE_COURSE_GROUP_OPTION,
    { refetchQueries: ['AdminCourseGroupOptions', 'CourseGroupOptions'] }
  );

  const labelFor = (title: string) =>
    KNOWN_TITLES.has(title) ? tCommon(`course_group_options.${title}`) : title;

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(options);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    try {
      await Promise.all(
        reordered.map((item, index) =>
          updateOrder({
            variables: { id: item.id, order: index + 1 },
            optimisticResponse: {
              update_CourseGroupOption_by_pk: {
                __typename: 'CourseGroupOption',
                id: item.id,
                order: index + 1,
              },
            },
            update: (cache) => {
              const existing = cache.readQuery<AdminCourseGroupOptions>({ query: ADMIN_COURSE_GROUP_OPTIONS });
              if (existing) {
                cache.writeQuery({
                  query: ADMIN_COURSE_GROUP_OPTIONS,
                  data: {
                    ...existing,
                    CourseGroupOption: reordered.map((o, i) => ({ ...o, order: i + 1 })),
                  },
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
    const title = newTitle.trim();
    if (!title) return;

    const exists = options.some(
      (o) => o.title.toLowerCase() === title.toLowerCase() || labelFor(o.title).toLowerCase() === title.toLowerCase()
    );
    if (exists) {
      setError(t('error_duplicate'));
      return;
    }

    const order = options.reduce((max, o) => Math.max(max, o.order), 0) + 1;
    try {
      setError('');
      await insertOption({ variables: { title, order, sliderGroup: false } });
      setNewTitle('');
    } catch {
      setError(t('error_add'));
    }
  };

  const handleDelete = async (option: AdminCourseGroupOptions_CourseGroupOption) => {
    try {
      setError('');
      await deleteOption({ variables: { id: option.id } });
    } catch {
      setError(t('error_delete'));
    }
  };

  const handleToggleSliderGroup = async (option: AdminCourseGroupOptions_CourseGroupOption) => {
    try {
      setError('');
      await updateSliderGroup({ variables: { id: option.id, sliderGroup: !option.sliderGroup } });
    } catch {
      setError(t('error_toggle'));
    }
  };

  return (
    <div className="mt-16">
      <label className="text-xs uppercase tracking-widest font-medium text-gray-400 mb-2 block">{t('label')}</label>
      <p className="text-xs text-gray-400 mb-4">{t('help_text')}</p>

      {/* Add a new course group option */}
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
        <Button as="button" type="button" filled inverted onClick={handleAdd} disabled={!newTitle.trim()}>
          {t('add_button')}
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="courseGroupOptionsTable">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {options.map((option, index) => {
                const count = connectedCount(option);
                const isAutoType = option.programType != null;
                const isOrgOwned = option.organizationId != null;
                const canDelete = count === 0 && !isAutoType;
                const deleteTooltip = isAutoType
                  ? t('delete_disabled_auto')
                  : count > 0
                  ? t('delete_disabled_in_use')
                  : t('delete');

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
                            {labelFor(option.title)}{' '}
                            <span className="text-base font-normal text-label-secondary">({count})</span>
                          </h2>
                          {isAutoType && (
                            <span className="text-xs uppercase tracking-wide rounded bg-gray-200 text-gray-600 px-2 py-1">
                              {t('auto_badge')}
                            </span>
                          )}
                          {isOrgOwned && (
                            <span className="text-xs uppercase tracking-wide rounded bg-gray-200 text-gray-600 px-2 py-1">
                              {t('org_badge')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-label-secondary select-none">
                            <input
                              type="checkbox"
                              checked={!!option.sliderGroup}
                              disabled={isOrgOwned}
                              onChange={() => handleToggleSliderGroup(option)}
                            />
                            {t('show_on_homepage')}
                          </label>
                          <span className="text-label-secondary w-6 text-right">{index + 1}</span>
                          <Tooltip title={deleteTooltip} placement="top">
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
    </div>
  );
};

export default CourseGroupOptionsManager;
