import { FC } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MdOutlineCategory, MdOutlineDescription } from 'react-icons/md';

import { useIsAdmin } from '../../../hooks/authentication';

const LINKS = [
  { key: 'project_types', href: '/manage/settings/project-types', icon: MdOutlineCategory },
  {
    key: 'documentation_instructions',
    href: '/manage/settings/documentation-instructions',
    icon: MdOutlineDescription,
  },
] as const;

/** Shortcuts from the overview header to the project settings that stay in Settings; Admins only. */
const ProjectsOverviewSettingsLinks: FC = () => {
  const t = useTranslations('projectsOverview');
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;

  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 -mt-6 mb-6">
      {LINKS.map(({ key, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className="inline-flex items-center gap-1 text-sm text-white underline hover:text-brand"
        >
          <Icon className="text-base" aria-hidden />
          {t(`settings_links.${key}`)}
        </Link>
      ))}
    </nav>
  );
};

export default ProjectsOverviewSettingsLinks;
