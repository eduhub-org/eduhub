import { ProgramType } from '../../../../types/enums';
import {
  creatableOrganizations,
  creatableProgramTypes,
  grantAllowsProgramType,
  ProgramCreationGrant,
} from '../programCreation';

const grant = (overrides: Partial<ProgramCreationGrant> & { organizationId: number; name: string }): ProgramCreationGrant => {
  const { name, ...rest } = overrides;
  return {
    Organization: { id: overrides.organizationId, name },
    canManageCourses: false,
    canManageEvents: false,
    canManageDegrees: false,
    canManageSettings: false,
    ...rest,
  };
};

describe('grantAllowsProgramType', () => {
  it('follows the per-type capability', () => {
    const eventsOnly = grant({ organizationId: 1, name: 'A', canManageEvents: true });

    expect(grantAllowsProgramType(eventsOnly, ProgramType.EVENTS)).toBe(true);
    expect(grantAllowsProgramType(eventsOnly, ProgramType.COURSES)).toBe(false);
    expect(grantAllowsProgramType(eventsOnly, ProgramType.DEGREES)).toBe(false);
  });

  it('lets a settings admin create every type', () => {
    const settings = grant({ organizationId: 1, name: 'A', canManageSettings: true });

    expect(
      [ProgramType.COURSES, ProgramType.EVENTS, ProgramType.DEGREES].every((type) =>
        grantAllowsProgramType(settings, type)
      )
    ).toBe(true);
  });
});

describe('creatableOrganizations', () => {
  const grants = [
    grant({ organizationId: 2, name: 'Zeta', canManageEvents: true }),
    grant({ organizationId: 3, name: 'Alpha', canManageSettings: true }),
    grant({ organizationId: 4, name: 'Beta', canManageCourses: true }),
  ];

  it('lists only organizations whose grant allows the type, sorted by name', () => {
    expect(creatableOrganizations(grants, ProgramType.EVENTS)).toEqual([
      { value: '3', label: 'Alpha' },
      { value: '2', label: 'Zeta' },
    ]);
    expect(creatableOrganizations(grants, ProgramType.DEGREES)).toEqual([{ value: '3', label: 'Alpha' }]);
  });

  it('is empty without a matching grant', () => {
    expect(creatableOrganizations([grants[0]], ProgramType.DEGREES)).toEqual([]);
  });
});

describe('creatableProgramTypes', () => {
  it('collects the types any grant allows', () => {
    const grants = [
      grant({ organizationId: 2, name: 'A', canManageEvents: true }),
      grant({ organizationId: 3, name: 'B', canManageDegrees: true }),
    ];

    expect(creatableProgramTypes(grants)).toEqual([ProgramType.EVENTS, ProgramType.DEGREES]);
  });
});
