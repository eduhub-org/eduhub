import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import AddProjectDialog from '../AddProjectDialog';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

jest.mock('react-markdown', () => ({ __esModule: true, default: () => null }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'authenticated' }),
}));

jest.mock('../../../../../../hooks/authedQuery', () => ({
  useRoleQuery: () => ({ data: undefined, loading: false }),
}));

jest.mock('../../../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [jest.fn(), { loading: false }],
}));

jest.mock('../../../../../../hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

// Picking an author is the user search dialog's job; here one click picks Ada.
jest.mock('../../../../../common/dialogs/SelectUserDialog', () => ({
  SelectUserDialog: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: (confirmed: boolean, user: unknown) => void;
  }) =>
    open ? (
      <button
        type="button"
        onClick={() => onClose(true, { id: 'author-1', firstName: 'Ada', lastName: 'Lovelace' })}
      >
        pick Ada
      </button>
    ) : null,
}));

jest.mock('../../../../CourseContent/Projects/ProjectFormatSelector', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../../../inputs/DropDownSelector', () => ({
  __esModule: true,
  default: () => null,
}));

const renderDialog = () =>
  render(
    <AddProjectDialog
      open
      onClose={jest.fn()}
      courseId={7}
      instructorUserId="instructor-1"
      defaultProjectType={null}
      defaultDocumentationInstructionId={null}
      blockedAuthorIds={new Set()}
      refetchQueries={[]}
      onError={jest.fn()}
    />
  );

describe('AddProjectDialog', () => {
  it('tells the Organizer that a Project Template can be published in the showcase', () => {
    renderDialog();

    expect(screen.getByText('projects.add_dialog.template_showcase_notice')).toBeInTheDocument();
  });

  it('drops the showcase note once the project has authors and is no template', () => {
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /projects.add_dialog.add_author/ }));
    // The picker renders outside the open dialog, which hides it from the accessibility tree.
    fireEvent.click(screen.getByText('pick Ada'));

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText('projects.add_dialog.template_showcase_notice')).not.toBeInTheDocument();
  });
});
