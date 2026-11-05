import {
  DEFAULT_ORGANIZATION_ID,
  filterByIncludedOrganizations,
  includedOrganizationIds,
} from './homeSliderOrganizations';

const course = (id: number, organizationId: number | null | undefined) => ({
  id,
  Program: organizationId === undefined ? null : { organizationId },
});

describe('includedOrganizationIds', () => {
  it('always contains the default organization', () => {
    expect(includedOrganizationIds(undefined)).toEqual([DEFAULT_ORGANIZATION_ID]);
    expect(includedOrganizationIds([])).toEqual([DEFAULT_ORGANIZATION_ID]);
  });

  it('adds the selected organizations once', () => {
    expect(includedOrganizationIds([{ organizationId: 7 }, { organizationId: 0 }])).toEqual([0, 7]);
  });
});

describe('filterByIncludedOrganizations', () => {
  it('keeps courses of the default organization (id 0) and of added organizations only', () => {
    const courses = [course(1, 0), course(2, 7), course(3, 9), course(4, undefined), course(5, null)];
    expect(filterByIncludedOrganizations(courses, [0, 7]).map((c) => c.id)).toEqual([1, 2]);
  });

  it('shows only the default organization without any additions', () => {
    const courses = [course(1, 0), course(2, 7)];
    expect(filterByIncludedOrganizations(courses, includedOrganizationIds([])).map((c) => c.id)).toEqual([1]);
  });
});
