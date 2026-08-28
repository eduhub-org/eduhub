import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import Loading from '../../common/Loading';
import { useManageQuery } from '../../../hooks/authedQuery';
import { useManageProgramWhere } from '../../../hooks/manageScope';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { Programs } from '../../../queries/__generated__/Programs';
import { ProgramType } from '../../../types/enums';
import { programTypeMessageKey } from '../../../helpers/programType';
import { Program_bool_exp } from '../../../__generated__/globalTypes';
import ManageCoursesContent from './index';

interface ProgramManagementDashboardProps {
  programType: ProgramType;
}

const ProgramManagementDashboard: FC<ProgramManagementDashboardProps> = ({ programType }) => {
  const t = useTranslations('manageCourses');
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

  if (programListRequest.loading) {
    return <Loading />;
  }
  if (programListRequest.error) {
    return (
      <div className="max-w-screen-xl mx-auto py-8 text-center text-error">{t('error_loading_programs')}</div>
    );
  }

  const programs = [...(programListRequest?.data?.Program || [])];

  if (programs.length === 0) {
    // No program of this type is visible to the current admin yet. Org admins cannot create
    // programs from the management UI (creation is platform-admin only and always produces a
    // COURSES program owned by no organization), so an informative empty state is shown instead
    // of a blank page to explain how to get unblocked.
    return (
      <div className="max-w-screen-xl mx-auto py-8 text-center text-gray-500">
        {t(`empty_state.${programTypeMessageKey(programType)}`)}
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <ManageCoursesContent programs={programs} programType={programType} />
    </div>
  );
};

export default ProgramManagementDashboard;
