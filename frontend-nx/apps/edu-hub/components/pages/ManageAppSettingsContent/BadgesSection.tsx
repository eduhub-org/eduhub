import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../../common/TableGrid';
import InputField from '../../inputs/InputField';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { Button } from '../../common/Button';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ADMIN_BADGES,
  BADGE_MAX_ORDER,
  INSERT_BADGE,
  UPDATE_BADGE_TITLE,
  UPDATE_BADGE_DESCRIPTION,
  UPDATE_BADGE_ICON,
  UPDATE_BADGE_ORDER,
  DELETE_BADGE,
} from '../../../queries/badge';
import { AdminBadges, AdminBadges_Badge } from '../../../queries/__generated__/AdminBadges';
import { BadgeMaxOrder } from '../../../queries/__generated__/BadgeMaxOrder';
import { InsertBadge, InsertBadgeVariables } from '../../../queries/__generated__/InsertBadge';
import { UpdateBadgeOrder, UpdateBadgeOrderVariables } from '../../../queries/__generated__/UpdateBadgeOrder';

// Badge edits change both the list and the global max order, so refetch both.
const REFETCH_QUERIES = ['AdminBadges', 'BadgeMaxOrder'];
const PAGE_SIZE = 20;

type BadgeRow = AdminBadges_Badge;

const awardCount = (row: BadgeRow) => row.ProjectBadges_aggregate?.aggregate?.count ?? 0;

/** Editable detail panel for a single badge (description, icon name, order). */
const BadgeExpandableRow: FC<{ badge: BadgeRow }> = ({ badge }) => {
  const t = useTranslations('manageAppSettings.badges');
  const [updateOrder] = useAdminMutation<UpdateBadgeOrder, UpdateBadgeOrderVariables>(UPDATE_BADGE_ORDER, {
    refetchQueries: REFETCH_QUERIES,
  });

  return (
    <div className="flex w-full flex-col gap-4 py-2">
      <div>
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-label-secondary">
          {t('column.description')}
        </span>
        <InputField
          variant="material"
          type="textarea"
          value={badge.description ?? ''}
          label={t('column.description')}
          placeholder={t('description_placeholder')}
          itemId={badge.id}
          updateValueMutation={UPDATE_BADGE_DESCRIPTION}
          refetchQueries={REFETCH_QUERIES}
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-label-secondary">
            {t('column.icon')}
          </span>
          <InputField
            variant="material"
            type="input"
            value={badge.icon ?? ''}
            label={t('column.icon')}
            placeholder={t('icon_placeholder')}
            itemId={badge.id}
            updateValueMutation={UPDATE_BADGE_ICON}
            refetchQueries={REFETCH_QUERIES}
          />
          <p className="mt-1 text-xs text-label-secondary">{t('icon_help')}</p>
        </div>
        <div className="w-full sm:w-40">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-label-secondary">
            {t('column.order')}
          </span>
          <input
            type="number"
            // Remount when the persisted order changes so the field never shows a stale value
            // after a refetch (expandable rows stay mounted).
            key={badge.order}
            defaultValue={badge.order}
            aria-label={t('column.order')}
            className="w-full rounded border border-border-primary bg-bg-card px-3 py-2 text-label-primary"
            onBlur={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!Number.isNaN(value) && value !== badge.order) {
                updateOrder({ variables: { id: badge.id, order: value } });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const BadgesSection: FC = () => {
  const t = useTranslations('manageAppSettings.badges');
  const tCommon = useTranslations('common');

  const [pageIndex, setPageIndex] = useState(0);
  const [searchFilter, setSearchFilterState] = useState('');

  const searchPattern = useMemo(() => `%${searchFilter.trim()}%`, [searchFilter]);

  const { data, loading, error } = useAdminQuery<AdminBadges>(ADMIN_BADGES, {
    variables: { limit: PAGE_SIZE, offset: pageIndex * PAGE_SIZE, search: searchPattern },
  });

  // Global max order (not limited by pagination/search) so a new badge appends last.
  const { data: maxOrderData } = useAdminQuery<BadgeMaxOrder>(BADGE_MAX_ORDER);
  const maxOrder = maxOrderData?.Badge_aggregate?.aggregate?.max?.order ?? 0;

  const badges = useMemo(() => data?.Badge ?? [], [data]);
  const totalCount = data?.Badge_aggregate?.aggregate?.count ?? 0;

  const setSearchFilter = useCallback((value: string) => {
    setSearchFilterState(value);
    setPageIndex(0);
  }, []);

  const [insertBadge] = useAdminMutation<InsertBadge, InsertBadgeVariables>(INSERT_BADGE, {
    refetchQueries: REFETCH_QUERIES,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addIcon, setAddIcon] = useState('');
  const [adding, setAdding] = useState(false);

  const openAddDialog = useCallback(() => {
    setAddTitle('');
    setAddDescription('');
    setAddIcon('');
    setAddOpen(true);
  }, []);

  const closeAddDialog = useCallback(() => {
    if (adding) return;
    setAddOpen(false);
  }, [adding]);

  const handleAddSubmit = useCallback(async () => {
    const title = addTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      await insertBadge({
        variables: {
          title,
          description: addDescription.trim() || null,
          icon: addIcon.trim() || null,
          order: maxOrder + 1,
        },
      });
      setAddOpen(false);
    } catch {
      // insertBadge already refetches on success via refetchQueries.
      setErrorMessage(t('error.create_failed'));
    } finally {
      setAdding(false);
    }
  }, [addTitle, addDescription, addIcon, maxOrder, insertBadge, t]);

  const generateDeletionConfirmation = useCallback(
    (row: BadgeRow) => t('delete_dialog.question', { title: row.title, count: awardCount(row) }),
    [t]
  );

  const columns = useMemo<ColumnDef<BadgeRow>[]>(
    () => [
      {
        accessorKey: 'icon',
        header: t('column.icon'),
        size: 120,
        cell: ({ getValue }) => {
          const icon = getValue<string | null>();
          return icon ? (
            <span className="font-mono text-xs text-label-secondary">{icon}</span>
          ) : (
            <span className="text-label-secondary">—</span>
          );
        },
      },
      {
        accessorKey: 'title',
        header: t('column.title'),
        size: 320,
        minSize: 220,
        cell: ({ getValue, row }) => (
          <InputField
            variant="material"
            type="input"
            value={getValue<string>()}
            label={t('column.title')}
            placeholder={t('column.title')}
            itemId={row.original.id}
            updateValueMutation={UPDATE_BADGE_TITLE}
            refetchQueries={REFETCH_QUERIES}
          />
        ),
      },
      {
        id: 'awards',
        header: t('column.awards'),
        size: 120,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-label-primary">{awardCount(row.original)}</span>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: t('column.updated'),
        size: 140,
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return (
            <span className="text-xs text-label-secondary">
              {value ? new Date(value).toLocaleDateString() : '—'}
            </span>
          );
        },
      },
    ],
    [t]
  );

  return (
    <div className="mt-8">
      <label className="mb-4 block text-xs font-medium uppercase tracking-widest text-label-secondary">
        {t('section_label')}
      </label>
      <p className="mb-4 text-sm text-label-secondary">{t('section_help')}</p>

      <TableGrid
        columns={columns}
        data={badges}
        totalCount={totalCount}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={PAGE_SIZE}
        searchFilter={searchFilter}
        onSearchFilterChange={setSearchFilter}
        error={error}
        loading={loading}
        refetchQueries={REFETCH_QUERIES}
        onAddButtonClick={openAddDialog}
        addButtonText={t('add_button')}
        deleteMutation={DELETE_BADGE}
        deleteVariableName="id"
        generateDeletionConfirmationQuestion={generateDeletionConfirmation}
        expandableRowComponent={({ row }) => <BadgeExpandableRow badge={row} />}
      />

      <DialogShell
        open={addOpen}
        onClose={closeAddDialog}
        title={t('add_dialog.title')}
        ariaLabelledBy="add-badge"
        maxWidth="sm"
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={closeAddDialog} disabled={adding}>
              {tCommon('cancel')}
            </Button>
            <Button filled onClick={handleAddSubmit} disabled={!addTitle.trim() || adding}>
              {t('add_dialog.submit')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('add_dialog.title_label')}</span>
            <input
              type="text"
              className="w-full rounded border border-border-primary px-3 py-2"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder={t('add_dialog.title_placeholder')}
              maxLength={200}
              disabled={adding}
              autoFocus
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('column.description')}</span>
            <textarea
              className="w-full rounded border border-border-primary px-3 py-2"
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder={t('description_placeholder')}
              rows={3}
              disabled={adding}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('column.icon')}</span>
            <input
              type="text"
              className="w-full rounded border border-border-primary px-3 py-2"
              value={addIcon}
              onChange={(e) => setAddIcon(e.target.value)}
              placeholder={t('icon_placeholder')}
              disabled={adding}
            />
            <span className="mt-1 block text-xs text-label-secondary">{t('icon_help')}</span>
          </label>
        </div>
      </DialogShell>

      <ErrorMessageDialog
        errorMessage={errorMessage ?? ''}
        open={Boolean(errorMessage)}
        onClose={() => setErrorMessage(null)}
      />
    </div>
  );
};

export default BadgesSection;
