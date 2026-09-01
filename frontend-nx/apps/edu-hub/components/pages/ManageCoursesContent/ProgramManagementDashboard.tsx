import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import CommonPageHeader from '../../common/CommonPageHeader';
import Loading from '../../common/Loading';
import DropDownSelector from '../../inputs/DropDownSelector';
import { useManageQuery } from '../../../hooks/authedQuery';
import { useIsAdmin } from '../../../hooks/authentication';
import { useManageProgramWhere } from '../../../hooks/manageScope';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { Programs } from '../../../queries/__generated__/Programs';
import { ProgramType } from '../../../types/enums';
import { programTypeMessageKey } from '../../../helpers/programType';
import { Program_bool_exp } from '../../../__generated__/globalTypes';
import ManageCoursesContent from './index';
import { organizationScopeOptions, resolveOrganizationScope } from './organizationScope';

interface ProgramManagementDashboardProps {
  programType: ProgramType;
}

// The chosen organization is remembered across the Courses/Degrees/Events screens (and reloads), so
// a super-admin does not have to re-pick it on every tab. "All organizations" is stored explicitly
// so it is not confused with "nothing chosen yet".
const ORGANIZATION_SCOPE_STORAGE_KEY = 'eduhub.manage.programOrganizationScope';
const ALL_ORGANIZATIONS = 'all';

/**
 * Organization scope of the program dashboards. `null` means "all organizations".
 *
 * The stored value is read after mount rather than during render: the management pages are
 * server-rendered and localStorage is browser-only, so reading it while rendering would make the
 * first client render differ from the server markup.
 */
const useStoredOrganizationScope = (enabled: boolean) => {
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    try {
      const stored = window.localStorage.getItem(ORGANIZATION_SCOPE_STORAGE_KEY);
      if (stored && stored !== ALL_ORGANIZATIONS) {
        const parsed = Number(stored);
        if (Number.isInteger(parsed)) {
          setOrganizationId(parsed);
        }
      }
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the default scope still works.
    }
  }, [enabled]);

  const selectOrganization = useCallback((next: number | null) => {
    setOrganizationId(next);
    try {
      window.localStorage.setItem(
        ORGANIZATION_SCOPE_STORAGE_KEY,
        next === null ? ALL_ORGANIZATIONS : String(next)
      );
    } catch {
      // See above: losing the preference is harmless.
    }
  }, []);

  return [organizationId, selectOrganization] as const;
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

  const [storedOrganizationId, selectOrganization] = useStoredOrganizationScope(isAdmin);

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

  // A super-admin sees the programs of every organization at once, which makes the program tabs
  // unusable as soon as more than one organization runs programs. The selector narrows them (and
  // the course list below) to a single organization. Org admins are already scoped by Hasura.
  const showOrganizationSelector = isAdmin && organizationOptions.length > 1;

  const organizationId = showOrganizationSelector
    ? resolveOrganizationScope(storedOrganizationId, organizationOptions)
    : null;

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
        nullable
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
