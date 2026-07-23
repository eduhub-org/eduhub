import { FC, useMemo } from 'react';

import Loading from '../../common/Loading';
import { useManageQuery } from '../../../hooks/authedQuery';
import { useManageProgramWhere } from '../../../hooks/manageScope';
import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../../queries/programList';
import { Programs } from '../../../queries/__generated__/Programs';
import { ProgramType } from '../../../types/enums';
import { Program_bool_exp } from '../../../__generated__/globalTypes';
import ManageCoursesContent from './index';

interface ProgramManagementDashboardProps {
  programType: ProgramType;
}

const ProgramManagementDashboard: FC<ProgramManagementDashboardProps> = ({ programType }) => {
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

  if (programListRequest.error) {
    console.log(programListRequest.error);
  }
  if (programListRequest.loading) {
    return <Loading />;
  }

  const programs = [...(programListRequest?.data?.Program || [])];

  return programs.length > 0 ? (
    <div className="max-w-screen-xl mx-auto">
      <ManageCoursesContent programs={programs} programType={programType} />
    </div>
  ) : (
    <></>
  );
};

export default ProgramManagementDashboard;
