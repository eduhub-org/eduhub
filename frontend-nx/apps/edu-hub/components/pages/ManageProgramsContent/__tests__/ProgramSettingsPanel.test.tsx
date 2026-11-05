import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProgramSettingsPanel from '../ProgramSettingsPanel';

let mockCanRename = true;
let mockProgramType = 'COURSES';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../../../../hooks/authentication', () => ({
  useManageRole: () => 'org_admin',
}));

jest.mock('../../../../hooks/orgAdminCapabilities', () => ({
  useCanManageProgramsOf: () => mockCanRename,
}));

jest.mock('../../../../hooks/authedQuery', () => ({
  useManageQuery: () => ({
    loading: false,
    error: undefined,
    data: {
      Program: [
        {
          id: 1,
          title: 'Coding.Waterkant',
          organizationId: 5,
          type: mockProgramType,
          published: true,
          applicationStart: null,
          defaultApplicationEnd: null,
          lectureStart: null,
          lectureEnd: null,
          defaultProjectSubmissionDeadline: null,
        },
      ],
    },
  }),
}));

jest.mock('../ExpandableProgramRow', () => () => null);
jest.mock('../../../inputs/InputField', () =>
  function MockInputField({ label }: { label: string }) {
    return <input aria-label={label} />;
  }
);
jest.mock('../../../inputs/CheckboxSelector', () => () => null);
jest.mock('../../../inputs/DatePicker', () => () => null);

describe('ProgramSettingsPanel', () => {
  beforeEach(() => {
    mockCanRename = true;
    mockProgramType = 'COURSES';
  });

  it('lets settings admins edit the title', () => {
    render(<ProgramSettingsPanel programId={1} onClose={jest.fn()} />);
    expect(screen.getByRole('textbox', { name: 'title.label' })).toBeInTheDocument();
  });

  it('shows the title read-only to admins without the settings privilege', () => {
    mockCanRename = false;
    render(<ProgramSettingsPanel programId={1} onClose={jest.fn()} />);
    expect(screen.queryByRole('textbox', { name: 'title.label' })).toBeNull();
    expect(screen.getByText('Coding.Waterkant')).toBeInTheDocument();
    expect(screen.getByText('rename_requires_settings')).toBeInTheDocument();
  });

  it('shows course period and project deadline for course programs', () => {
    render(<ProgramSettingsPanel programId={1} onClose={jest.fn()} />);
    expect(screen.getByText('course_start')).toBeInTheDocument();
    expect(screen.getByText('project_submission_deadline')).toBeInTheDocument();
  });

  it('leaves out course period and project deadline for event programs', () => {
    mockProgramType = 'EVENTS';
    render(<ProgramSettingsPanel programId={1} onClose={jest.fn()} />);
    expect(screen.getByText('application_start')).toBeInTheDocument();
    expect(screen.queryByText('course_start')).toBeNull();
    expect(screen.queryByText('course_end')).toBeNull();
    expect(screen.queryByText('project_submission_deadline')).toBeNull();
  });
});
