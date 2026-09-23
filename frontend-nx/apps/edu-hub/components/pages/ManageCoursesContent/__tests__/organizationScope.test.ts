import {
  organizationScopeOptions,
  programTabStorageKey,
  resolveOrganizationScope,
  resolveProgramTab,
} from '../organizationScope';

const program = (id: number, name: string) => ({ Organization: { id, name } });

describe('organizationScopeOptions', () => {
  it('lists each owning organization once, sorted by name', () => {
    const options = organizationScopeOptions([
      program(3, 'Uni Kiel'),
      program(1, 'EduHub Default'),
      program(3, 'Uni Kiel'),
      program(2, 'Fachhochschule Westküste'),
    ]);

    expect(options).toEqual([
      { value: '1', label: 'EduHub Default' },
      { value: '2', label: 'Fachhochschule Westküste' },
      { value: '3', label: 'Uni Kiel' },
    ]);
  });

  it('returns no options when there are no programs', () => {
    expect(organizationScopeOptions([])).toEqual([]);
  });
});

describe('resolveOrganizationScope', () => {
  const withDefault = organizationScopeOptions([
    program(0, 'EduHub Default'),
    program(2, 'Uni Kiel'),
    program(5, 'FH Kiel'),
  ]);
  const withoutDefault = organizationScopeOptions([program(2, 'Uni Kiel'), program(5, 'FH Kiel')]);

  it('keeps a remembered organization that owns programs of this type', () => {
    expect(resolveOrganizationScope(2, withDefault)).toBe(2);
  });

  it('defaults to the EduHub default organization when nothing is remembered', () => {
    expect(resolveOrganizationScope(null, withDefault, { initialOrganizationId: 5 })).toBe(0);
  });

  it('defaults to the initially granted organization when the default one is not visible', () => {
    expect(resolveOrganizationScope(null, withoutDefault, { initialOrganizationId: 2 })).toBe(2);
  });

  it('falls back to the first option when neither default applies', () => {
    expect(resolveOrganizationScope(null, withoutDefault)).toBe(5);
  });

  it('replaces a remembered organization that owns no program of this type by the default', () => {
    // Happens when switching from Courses to Events: the organization runs courses but no events.
    expect(resolveOrganizationScope(3, withDefault)).toBe(0);
  });

  it('returns null when there are no options', () => {
    expect(resolveOrganizationScope(null, [])).toBeNull();
  });
});

describe('resolveProgramTab', () => {
  const allTabId = -1;
  const tabIds = [11, 12, allTabId];

  it('restores a remembered program that is still shown', () => {
    expect(resolveProgramTab(12, tabIds, allTabId, 11)).toBe(12);
  });

  it('restores the remembered "All programs" tab', () => {
    expect(resolveProgramTab('all', tabIds, allTabId, 11)).toBe(allTabId);
  });

  it('falls back when the remembered program is no longer shown', () => {
    expect(resolveProgramTab(99, tabIds, allTabId, 11)).toBe(11);
  });

  it('falls back when nothing is remembered', () => {
    expect(resolveProgramTab(undefined, tabIds, allTabId, 11)).toBe(11);
  });
});

describe('programTabStorageKey', () => {
  it('is specific to program type and organization', () => {
    expect(programTabStorageKey('COURSES', 0)).toBe('COURSES:0');
    expect(programTabStorageKey('EVENTS', null)).toBe('EVENTS:all');
  });
});
