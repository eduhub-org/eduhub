import { organizationScopeOptions, resolveOrganizationScope } from '../organizationScope';

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
  const options = organizationScopeOptions([program(1, 'EduHub Default'), program(2, 'Uni Kiel')]);

  it('keeps a remembered organization that owns programs of this type', () => {
    expect(resolveOrganizationScope(2, options)).toBe(2);
  });

  it('falls back to all organizations when nothing is remembered', () => {
    expect(resolveOrganizationScope(null, options)).toBeNull();
  });

  it('falls back to all organizations when the remembered one owns no program of this type', () => {
    // Happens when switching from Courses to Events: the organization runs courses but no events.
    expect(resolveOrganizationScope(3, options)).toBeNull();
  });
});
