import { FC, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { ColumnDef } from '@tanstack/react-table';

import TableGrid from '../common/TableGrid';
import Loading from '../common/Loading';

import { useAdminQuery } from '../../hooks/authedQuery';
import {
  ACHIEVEMENT_DOCUMENTATION_TEMPLATES,
  DELETE_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
  INSERT_ACHIEVEMENT_DOCUMENTATION_TEMPLATE,
} from '../../queries/achievementDocumentationTemplate';
import {
  AchievementDocumentationTemplates,
  AchievementDocumentationTemplates_AchievementDocumentationTemplate,
} from '../../queries/__generated__/AchievementDocumentationTemplates';

const ManageAchievementTemplatesContent: FC = () => {
  const { data, loading, error } = useAdminQuery<AchievementDocumentationTemplates>(
    ACHIEVEMENT_DOCUMENTATION_TEMPLATES
  );

  const columns = useMemo<ColumnDef<AchievementDocumentationTemplates_AchievementDocumentationTemplate>[]>(
    () => [
      {
        accessorKey: 'title',
        enableSorting: true,
        meta: {
          width: 3,
        },
      },
      {
        accessorKey: 'url',
        accessorFn: (row) => ({ title: row.title, url: row.url }),
        className: '',
        meta: {
          width: 3,
        },
        cell: ({ getValue }) => (
          <div>
            <a href={getValue<{ title: string; url: string }>().url}>
              {getValue<{ title: string; url: string }>().title}
            </a>
          </div>
        ),
      },
    ],
    []
  );

  if (error) {
    console.log(error);
  }
  if (loading) {
    return <Loading />;
  }
  return (
    <div className="max-w-screen-xl mx-auto">
      {loading && <Loading />}
      {error && <div>Es ist ein Fehler aufgetreten</div>}
      {!loading && !error && (
        <TableGrid columns={columns} data={data.AchievementDocumentationTemplate} showDelete translationNamespace="" />
      )}
    </div>
  );
};

export default ManageAchievementTemplatesContent;
