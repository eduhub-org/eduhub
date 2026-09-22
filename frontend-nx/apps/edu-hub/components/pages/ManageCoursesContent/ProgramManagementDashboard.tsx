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
import { organizationScopeOptions, resolveOrganizationScope, StoredOrganizationScope } from './organizationScope';

interface ProgramManagementDashboardProps {
  programType: ProgramType;
}

// The chosen organization is remembered across the Courses/Degrees/Events screens (and reloads), so
// an admin does not have to re-pick it on every tab. "All organizations" is stored explicitly so it
// is not confused with "nothing chosen yet". The key was versioned when "nothing chosen" stopped
// meaning "all organizations", so a stale "all" from that time does not override the new default.
const ORGANIZATION_SCOPE_STORAGE_KEY = 'eduhub.manage.programOrganizationScope.v2';
const ALL_ORGANIZATIONS = 'all';

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
      if (stored === ALL_ORGANIZATIONS) {
        setStoredScope(ALL_ORGANIZATIONS);
      } else if (stored) {
        const parsed = Number(stored);
        if (Number.isInteger(parsed)) {
          setStoredScope(parsed);
        }
      }
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the default scope still works.
    }
  }, []);

  const selectOrganization = useCallback((next: number | null) => {
    setStoredScope(next === null ? ALL_ORGANIZATIONS : next);
    try {
      window.localStorage.setItem(
        ORGANIZATION_SCOPE_STORAGE_KEY,
        next === null ? ALL_ORGANIZATIONS : String(next)
      );
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
const useInitialOrganizationId = (): number | null => {
  const isOrgAdmin = useIsOrgAdmin();
  const isAdmin = useIsAdmin();
  const userId = useUserId();
  const { data } = useOrgAdminQuery<MyOrgAdminCapabilities>(MY_ORG_ADMIN_CAPABILITIES, {
    variables: { userId },
    skip: isAdmin || !isOrgAdmin || !userId,
  });
  return data?.OrganizationAdmin?.[0]?.organizationId ?? null;
};

const ProgramManagementDashboard: FC<ProgramManagementDashboardProps> = ({ programType }) => {
  const t = useTranslations('manageCourses');
  const tCoursePage = useTranslations('coursePage');
  const isAdmin = useIsAdmin();

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
  const initialOrganizationId = useInitialOrganizationId();

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
  // below are narrowed to it. Only super-admins may additionally look at all organizations at once.
  // New offerings can only be created while a single organization is in scope.
  const showOrganizationSelector = organizationOptions.length > 1;
  const allowAllOrganizations = isAdmin && showOrganizationSelector;

  // Null only when a super-admin explicitly chose "all organizations" (or nothing is visible).
  const organizationId = resolveOrganizationScope(storedScope, organizationOptions, {
    allowAll: allowAllOrganizations,
    initialOrganizationId,
  });

  const programs = useMemo(
    () =>
      organizationId === null
        ? [...allPrograms]
        : allPrograms.filter((program) => program.organizationId === organizationId),
    [allPrograms, organizationId]
  );

  const handleOrganizationChange = useCallback(
    (value: string) => selectOrganization(value ? Number(value) : null),
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
        nullable={allowAllOrganizations}
        nullableLabel={t('all_organizations_scope')}
        onValueUpdated={handleOrganizationChange}
      />
    </div>
  );

  const body = () => {
    if (programListRequest.loading) {
      return <Loading />;
    }
    if (programListRequest.error) {
      return <div className="py-8 text-center text-error">{t('error_loading_programs')}</div>;
    }
    if (programs.length === 0) {
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
        key={organizationId ?? ALL_ORGANIZATIONS}
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
