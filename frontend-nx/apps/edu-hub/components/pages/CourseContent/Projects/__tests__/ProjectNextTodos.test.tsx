import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectNextTodos from '../ProjectNextTodos';
import { ProjectRow, ProjectTypeRequirements } from '../types';

// Keys are asserted directly — the wording lives in the locale files.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const DOCUMENTATION_ONLY: ProjectTypeRequirements = {
  value: 'PROJECT_WITH_DOCUMENTATION_ONLY',
  requiresDocumentation: true,
  requiresPresentation: false,
  requiresExternalUrl: false,
  requiresCoverImage: true,
};

/** An ONGOING project with every deliverable of its type in place. */
const ongoingComplete = (overrides: Partial<ProjectRow> = {}): ProjectRow =>
  ({
    status: 'ONGOING',
    documentationUrl: 'projects/doc.pdf',
    coverImageUrl: 'projects/cover.png',
    presentationUrl: null,
    externalUrl: null,
    sentBackAt: null,
    ProjectAuthors: [{ participationStatus: 'ACCEPTED' }],
    ...overrides,
  } as unknown as ProjectRow);

const renderTodos = (project: ProjectRow) =>
  render(
    <ProjectNextTodos
      project={project}
      projectType={DOCUMENTATION_ONLY}
      canEditProjectTitle
      requestedJoinCount={0}
    />
  );

describe('ProjectNextTodos for an ONGOING project', () => {
  it('reports no open tasks once every requirement is met', () => {
    renderTodos(ongoingComplete());

    expect(screen.getByText('projects.next_todos.none_open')).toBeInTheDocument();
  });

  it('asks a team whose project was sent back to revise and resubmit', () => {
    renderTodos(ongoingComplete({ sentBackAt: '2026-08-20T09:00:00Z' }));

    expect(
      screen.getByText('projects.next_todos.ongoing.revise_after_feedback')
    ).toBeInTheDocument();
    expect(screen.queryByText('projects.next_todos.none_open')).not.toBeInTheDocument();
  });

  it('lists a missing deliverable alongside the revision task', () => {
    renderTodos(
      ongoingComplete({ sentBackAt: '2026-08-20T09:00:00Z', coverImageUrl: null })
    );

    expect(
      screen.getByText('projects.next_todos.ongoing.revise_after_feedback')
    ).toBeInTheDocument();
    expect(
      screen.getByText('projects.next_todos.ongoing.cover_image_upload')
    ).toBeInTheDocument();
  });

  it('surfaces a pending join request that blocks submission', () => {
    renderTodos(
      ongoingComplete({
        ProjectAuthors: [
          { participationStatus: 'ACCEPTED' },
          { participationStatus: 'REQUESTED' },
        ],
      } as unknown as Partial<ProjectRow>)
    );

    expect(
      screen.getByText('projects.next_todos.ongoing.authors_pending')
    ).toBeInTheDocument();
  });
});
