import { ProjectRow, ProjectTypeRequirements } from './types';
import { isChecklistComplete } from './SubmissionChecklist';

/** Deliverable profile of the documentation-only classical project type. */
const DOCUMENTATION_ONLY: ProjectTypeRequirements = {
  value: 'PROJECT_WITH_DOCUMENTATION_ONLY',
  requiresDocumentation: true,
  requiresPresentation: false,
  requiresExternalUrl: false,
  requiresCoverImage: true,
};

const project = (overrides: Partial<ProjectRow> = {}): ProjectRow =>
  ({
    documentationUrl: 'projects/doc.pdf',
    coverImageUrl: 'projects/cover.png',
    presentationUrl: null,
    externalUrl: null,
    ProjectAuthors: [{ participationStatus: 'ACCEPTED' }],
    ...overrides,
  } as unknown as ProjectRow);

describe('isChecklistComplete for the documentation-only project type', () => {
  it('passes with documentation, cover image and an accepted author', () => {
    expect(isChecklistComplete(project(), DOCUMENTATION_ONLY)).toBe(true);
  });

  it('still requires the cover image', () => {
    expect(isChecklistComplete(project({ coverImageUrl: null }), DOCUMENTATION_ONLY)).toBe(
      false
    );
  });

  it('requires the documentation upload', () => {
    expect(
      isChecklistComplete(project({ documentationUrl: 'pending_upload' }), DOCUMENTATION_ONLY)
    ).toBe(false);
  });

  it('does not require a presentation or an external link', () => {
    expect(
      isChecklistComplete(
        project({ presentationUrl: null, externalUrl: null }),
        DOCUMENTATION_ONLY
      )
    ).toBe(true);
  });

  it('blocks while a join request is still pending', () => {
    expect(
      isChecklistComplete(
        project({
          ProjectAuthors: [
            { participationStatus: 'ACCEPTED' },
            { participationStatus: 'REQUESTED' },
          ],
        } as unknown as Partial<ProjectRow>),
        DOCUMENTATION_ONLY
      )
    ).toBe(false);
  });
});
