import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { icons, type LucideIcon } from 'lucide-react';

import TableGrid from '../../common/TableGrid';
import InputField from '../../inputs/InputField';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { Button } from '../../common/Button';

import { useAdminQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  ADMIN_BADGES,
  INSERT_BADGE,
  UPDATE_BADGE_TITLE,
  UPDATE_BADGE_DESCRIPTION,
  UPDATE_BADGE_ICON,
  DELETE_BADGE,
} from '../../../queries/badge';
import { AdminBadges, AdminBadges_Badge } from '../../../queries/__generated__/AdminBadges';
import { InsertBadge, InsertBadgeVariables } from '../../../queries/__generated__/InsertBadge';

const REFETCH_QUERIES = ['AdminBadges'];
const PAGE_SIZE = 20;

type BadgeRow = AdminBadges_Badge;

const awardCount = (row: BadgeRow) => row.ProjectBadges_aggregate?.aggregate?.count ?? 0;

// Resolve a stored lucide icon name (e.g. "trophy", "graduation-cap") to its
// PascalCase component key.
const toPascalCase = (name: string) =>
  name
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/** Renders the actual lucide icon for a badge, falling back to a dash. */
const BadgeIcon: FC<{ name: string | null }> = ({ name }) => {
  const Icon = name ? (icons as Record<string, LucideIcon>)[toPascalCase(name)] : undefined;
  if (!Icon) return <span className="text-label-secondary">—</span>;
  return <Icon size={20} className="text-label-primary" aria-label={name ?? undefined} />;
};

/** Editable detail panel for a single badge (description and icon name). */
const BadgeExpandableRow: FC<{ badge: BadgeRow }> = ({ badge }) => {
  const t = useTranslations('manageAppSettings.badges');

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
      <div>
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
        },
      });
      setAddOpen(false);
    } catch {
      // insertBadge already refetches on success via refetchQueries.
      setErrorMessage(t('error.create_failed'));
    } finally {
      setAdding(false);
    }
  }, [addTitle, addDescription, addIcon, insertBadge, t]);

  const generateDeletionConfirmation = useCallback(
    (row: BadgeRow) => t('delete_dialog.question', { title: row.title, count: awardCount(row) }),
    [t]
  );

  const columns = useMemo<ColumnDef<BadgeRow>[]>(
    () => [
      {
        accessorKey: 'icon',
        header: t('column.icon'),
        size: 90,
        meta: { align: 'center' },
        cell: ({ getValue }) => <BadgeIcon name={getValue<string | null>()} />,
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
