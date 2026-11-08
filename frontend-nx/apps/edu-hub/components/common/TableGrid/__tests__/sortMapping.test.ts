import { mergeSortDirection, NULLS_LAST } from '../utils';

describe('mergeSortDirection', () => {
  it('puts the direction into nested null leaves', () => {
    expect(mergeSortDirection({ CourseEnrollments_aggregate: { count: null } }, 'desc')).toEqual({
      CourseEnrollments_aggregate: { count: 'desc' },
    });
  });

  it('sorts NULLS_LAST leaves with nulls last in both directions', () => {
    expect(mergeSortDirection({ rate: NULLS_LAST }, 'asc')).toEqual({ rate: 'asc_nulls_last' });
    expect(mergeSortDirection({ rate: NULLS_LAST }, 'desc')).toEqual({ rate: 'desc_nulls_last' });
  });
});
