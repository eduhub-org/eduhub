import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DegreeParticipationsTab } from '..';
import type { ManagedCourse_Course_by_pk } from '../../../../../queries/__generated__/ManagedCourse';

let mockIsAdmin = false;
const tableGridProps = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

jest.mock('../../../../../hooks/authentication', () => ({
  useIsAdmin: () => mockIsAdmin,
}));

jest.mock('../../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [jest.fn()],
}));

jest.mock('../../../../../hooks/authedQuery', () => ({
  useRoleQuery: jest.fn(),
}));

jest.mock('../../../../common/TableGrid/hooks', () => ({
  usePersistedPageSize: () => [20, jest.fn()],
  useTableGrid: () => ({
    data: { CourseEnrollment: [], CourseEnrollment_aggregate: { aggregate: { count: 0 } } },
    loading: false,
    error: undefined,
    pageIndex: 0,
    setPageIndex: jest.fn(),
    searchFilter: '',
    setSearchFilter: jest.fn(),
    sorting: [],
    setSorting: jest.fn(),
  }),
}));

// Capture what the tab hands to the table instead of rendering it.
jest.mock('../../../../common/TableGrid', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    tableGridProps(props);
    return null;
  },
}));

const course = { id: 7 } as unknown as ManagedCourse_Course_by_pk;

const lastTableProps = () => tableGridProps.mock.calls[tableGridProps.mock.calls.length - 1][0];

describe('DegreeParticipationsTab certificate actions', () => {
  beforeEach(() => {
    tableGridProps.mockClear();
    mockIsAdmin = false;
  });

  it('offers generating and deleting certificates to admins', () => {
    mockIsAdmin = true;
    render(<DegreeParticipationsTab course={course} />);

    expect(lastTableProps().bulkActions.map((action: { value: string }) => action.value)).toEqual([
      'generate-achievement-certificates',
      'delete-achievement-certificates',
    ]);
    expect(lastTableProps().showCheckbox).toBe(true);
  });

  it('offers no certificate actions to instructors and org admins', () => {
    render(<DegreeParticipationsTab course={course} />);

    expect(lastTableProps().bulkActions).toEqual([]);
    expect(lastTableProps().showCheckbox).toBe(false);
  });
});
