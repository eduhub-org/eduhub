import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProjectShowcaseActions from '../ProjectShowcaseActions';
import { ProjectRow } from '../../../../CourseContent/Projects/types';
import { AuthRoles } from '../../../../../../types/enums';
import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../../../__generated__/globalTypes';

const mockUpdatePublished = jest.fn();
const mockUseRoleMutation = jest.fn();
let mockManagementRole: AuthRoles | undefined;

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

jest.mock('../../../../../../hooks/authedMutation', () => ({
  useRoleMutation: (...args: unknown[]) => mockUseRoleMutation(...args),
}));

jest.mock('../../../../../../hooks/managementRole', () => ({
  useManagementRoleContext: () => mockManagementRole,
}));

jest.mock('../../../../../../hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

// The preview body is the shared Project Page layout; here it only has to show which project.
jest.mock('../../../../CourseContent/Projects/ProjectPreviewLayout', () => ({
  __esModule: true,
  default: ({ project }: { project: { title: string } }) => (
    <div data-testid="project-preview">{project.title}</div>
  ),
}));

const passedProject = {
  __typename: 'Project',
  id: 42,
  title: 'Solar Boat',
  status: ProjectStatus_enum.COMPLETED,
  published: false,
  type: 'TEAM_PROJECT',
  ProjectType: null,
  rating: null,
  ratingComment: null,
  suggestedForPublication: true,
  ProjectAuthors: [
    {
      __typename: 'ProjectAuthor',
      id: 1,
      userId: 'author-1',
      participationStatus: ProjectParticipationStatus_enum.ACCEPTED,
      User: { __typename: 'User', id: 'author-1', firstName: 'Ada', lastName: 'Lovelace' },
    },
  ],
} as unknown as ProjectRow;

const renderActions = (project: ProjectRow, onError = jest.fn()) =>
  render(<ProjectShowcaseActions project={project} refetchQueries={['ProjectsOverview']} onError={onError} />);

describe('ProjectShowcaseActions', () => {
  beforeEach(() => {
    mockManagementRole = AuthRoles.admin;
    mockUpdatePublished.mockReset();
    mockUpdatePublished.mockResolvedValue({ data: {} });
    mockUseRoleMutation.mockReset();
    mockUseRoleMutation.mockReturnValue([mockUpdatePublished, { loading: false }]);
  });

  it('lets an Admin publish a Passed Project', async () => {
    renderActions(passedProject);

    fireEvent.click(screen.getByRole('button', { name: 'projects.actions.publish' }));

    await waitFor(() =>
      expect(mockUpdatePublished).toHaveBeenCalledWith({
        variables: { itemId: 42, published: true, suggestedForPublication: false },
      })
    );
    // The row's query reloads, so the row shows the new state.
    expect(mockUseRoleMutation.mock.calls[0][1]).toEqual({ refetchQueries: ['ProjectsOverview'] });
    expect(await screen.findByText('projects.notifications.publish_success')).toBeInTheDocument();
  });

  it('lets an Admin unpublish a published project and keeps its suggestion', async () => {
    renderActions({ ...passedProject, published: true, suggestedForPublication: true });

    fireEvent.click(screen.getByRole('button', { name: 'projects.actions.unpublish' }));

    await waitFor(() =>
      expect(mockUpdatePublished).toHaveBeenCalledWith({
        variables: { itemId: 42, published: false, suggestedForPublication: true },
      })
    );
  });

  it('does not offer publishing to an Org Admin', () => {
    mockManagementRole = AuthRoles.org_admin;
    renderActions(passedProject);

    expect(screen.queryByRole('button', { name: 'projects.actions.publish' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'projects.actions.preview' })).toBeInTheDocument();
  });

  it('does not offer publishing a project that is still being worked on', () => {
    renderActions({ ...passedProject, status: ProjectStatus_enum.ONGOING });

    expect(screen.queryByRole('button', { name: 'projects.actions.publish' })).not.toBeInTheDocument();
  });

  it('reports a failed publish', async () => {
    mockUpdatePublished.mockRejectedValue(new Error('nope'));
    const onError = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    renderActions(passedProject, onError);

    fireEvent.click(screen.getByRole('button', { name: 'projects.actions.publish' }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith('projects.notifications.publish_failed'));
  });

  it('opens the project preview', () => {
    renderActions(passedProject);

    expect(screen.queryByTestId('project-preview')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'projects.actions.preview' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('project-preview')).toHaveTextContent('Solar Boat');
  });
});
