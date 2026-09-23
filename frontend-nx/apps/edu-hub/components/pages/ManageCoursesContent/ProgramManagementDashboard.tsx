import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import CommonPageHeader from '../../common/CommonPageHeader';
import Loading from '../../common/Loading';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useManageQuery, useOrgAdminQuery } from '../../../hooks/authedQuery';
import { useIsAdmin, useIsOrgAdmin } from '../../../hooks/authentication';
import { useManageProgramWhere } from '../../../hooks/manageScope';
import { useUserId } from '../../../hooks/user';
import { MY_ORG_ADMIN_CAPABILITIES } from '../../../queries/organizationAdmin';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { MyOrgAdminCapabilities } from '../../../queries/__generated__/MyOrgAdminCapabilities';
import { Programs } from '../../../queries/__generated__/Programs';
import { ProgramType } from '../../../types/enums';
import { programTypeMessageKey } from '../../../helpers/programType';
import { Program_bool_exp } from '../../../__generated__/globalTypes';
import ManageCoursesContent from './index';
import {
  DEFAULT_ORGANIZATION_ID,
  organizationScopeOptions,
  resolveOrganizationScope,
  StoredOrganizationScope,
} from './organizationScope';

interface ProgramManagementDashboardProps {
  programType: ProgramType;
}

// The chosen organization is remembered across the Courses/Degrees/Events screens (and reloads), so
// an admin does not have to re-pick it on every tab. The key was versioned when "nothing chosen"
// stopped meaning "all organizations", so a stale choice from that time does not override the
// default. A stored "all" from the since-removed "All organizations" option is ignored when read.
const ORGANIZATION_SCOPE_STORAGE_KEY = 'eduhub.manage.programOrganizationScope.v2';

/**
 * Remembered organization scope of the program dashboards (see StoredOrganizationScope).
 *
 * The stored value is read after mount rather than during render: the management pages are
 * server-rendered and localStorage is browser-only, so reading it while rendering would make the
 * first client render differ from the server markup.
 */
const useStoredOrganizationScope = () => {
  const [storedScope, setStoredScope] = useState<StoredOrganizationScope>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ORGANIZATION_SCOPE_STORAGE_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (Number.isInteger(parsed)) {
          setStoredScope(parsed);
        }
      }
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the default scope still works.
    }
  }, []);

  const selectOrganization = useCallback((next: number) => {
    setStoredScope(next);
    try {
      window.localStorage.setItem(ORGANIZATION_SCOPE_STORAGE_KEY, String(next));
    } catch {
      // See above: losing the preference is harmless.
    }
  }, []);

  return [storedScope, selectOrganization] as const;
};

/**
 * Organization of the current org admin's oldest grant — the organization they were initially given
 * access to. Null for super-admins (who usually hold no grants) and while loading.
 */
const useInitialOrganizationId = (): { initialOrganizationId: number | null; loading: boolean } => {
  const isOrgAdmin = useIsOrgAdmin();
  const isAdmin = useIsAdmin();
  const userId = useUserId();
  const skip = isAdmin || !isOrgAdmin || !userId;
  const { data, loading } = useOrgAdminQuery<MyOrgAdminCapabilities>(MY_ORG_ADMIN_CAPABILITIES, {
    variables: { userId },
    skip,
  });
  return {
    initialOrganizationId: data?.OrganizationAdmin?.[0]?.organizationId ?? null,
    // An org admin whose user id is not known yet has not started the query either.
    loading: !isAdmin && isOrgAdmin && (!userId || loading),
  };
};

const ProgramManagementDashboard: FC<ProgramManagementDashboardProps> = ({ programType }) => {
  const t = useTranslations('manageCourses');
  const tCoursePage = useTranslations('coursePage');

  // Org admins only see programs (and therefore courses) of organizations they administer; for
  // super-admins the where filter is empty. useManageQuery pins admin vs org_admin accordingly.
  // Each view additionally restricts to a single Program.type.
  const scopeWhere = useManageProgramWhere();
  const where = useMemo((): Program_bool_exp => {
    const typeFilter: Program_bool_exp = { type: { _eq: programType } };
    if (Object.keys(scopeWhere).length === 0) {
      return typeFilter;
    }
    return { _and: [scopeWhere, typeFilter] };
  }, [scopeWhere, programType]);

  const programListRequest = useManageQuery<Programs>(PROGRAMS_WITH_MINIMUM_PROPERTIES, {
    variables: { where },
  });

  const [storedScope, selectOrganization] = useStoredOrganizationScope();
  const { initialOrganizationId, loading: initialOrganizationLoading } = useInitialOrganizationId();

  const headline = useMemo(() => {
    switch (programType) {
      case ProgramType.EVENTS:
        return tCoursePage('eventsHeadline');
      case ProgramType.DEGREES:
        return tCoursePage('degreesHeadline');
      default:
        return tCoursePage('coursesHeadline');
    }
  }, [programType, tCoursePage]);

  const allPrograms = useMemo(() => programListRequest.data?.Program ?? [], [programListRequest.data]);

  const organizationOptions = useMemo(() => organizationScopeOptions(allPrograms), [allPrograms]);

  // Admins who see the programs of more than one organization (every super-admin, and org admins of
  // several organizations) pick one organization at a time; the program tabs and the course list
  // below are narrowed to it.
  const showOrganizationSelector = organizationOptions.length > 1;

  // Null only when no program is visible at all.
  const organizationId = resolveOrganizationScope(storedScope, organizationOptions, { initialOrganizationId });

  const programs = useMemo(
    () => allPrograms.filter((program) => program.organizationId === organizationId),
    [allPrograms, organizationId]
  );

  const handleOrganizationChange = useCallback(
    (value: string) => {
      if (value) {
        selectOrganization(Number(value));
      }
    },
    [selectOrganization]
  );

  const organizationSelector = showOrganizationSelector && (
    <div className="mb-5 max-w-md">
      <DropDownSelector
        variant="eduhub"
        label={t('organization_scope_label')}
        value={organizationId === null ? '' : String(organizationId)}
        options={organizationOptions}
        searchable
        onValueUpdated={handleOrganizationChange}
      />
    </div>
  );

  const body = () => {
    // Until an org admin's initial grant is known, the fallback organization may not be the one the
    // dashboard settles on — so do not render (and allow creating offerings in) it. Not needed when
    // the default organization or a remembered one is in effect, as the grant cannot change those.
    const waitingForInitialOrganization =
      initialOrganizationLoading &&
      organizationId !== DEFAULT_ORGANIZATION_ID &&
      !(typeof storedScope === 'number' && storedScope === organizationId);
    if (programListRequest.loading || waitingForInitialOrganization) {
      return <Loading />;
    }
    if (programListRequest.error) {
      return <div className="py-8 text-center text-error">{t('error_loading_programs')}</div>;
    }
    if (organizationId === null || programs.length === 0) {
      // No program of this type is visible to the current admin yet. Org admins cannot create
      // programs from the management UI (creation is platform-admin only and always produces a
      // COURSES program owned by the default organization), so an informative empty state is shown
      // instead of a blank page to explain how to get unblocked.
      return (
        <div className="py-8 text-center text-label-secondary">
          {t(`empty_state.${programTypeMessageKey(programType)}`)}
        </div>
      );
    }
    return (
      // Remounting on an organization change resets the selected program tab and the course
      // filters, which would otherwise still point at a program of the previous organization.
      <ManageCoursesContent
        key={organizationId}
        programs={programs}
        programType={programType}
        organizationId={organizationId}
      />
    );
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <CommonPageHeader headline={headline} />
      {organizationSelector}
      {body()}
    </div>
  );
};

export default ProgramManagementDashboard;
