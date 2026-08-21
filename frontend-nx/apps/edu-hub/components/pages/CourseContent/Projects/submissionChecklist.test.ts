import { ProjectRow, ProjectTypeRequirements } from './types';
import {
  getProjectSubmissionBlockers,
  getProjectSubmissionRequirements,
  isChecklistComplete,
} from './SubmissionChecklist';

/** Deliverable profile of the documentation-only classical project type. */
const DOCUMENTATION_ONLY: ProjectTypeRequirements = {
  value: 'PROJECT_WITH_DOCUMENTATION_ONLY',
  requiresDocumentation: true,
  requiresPresentation: false,
  requiresExternalUrl: false,
  requiresCoverImage: true,
};

/** The type from the bug report: documentation + link + presentation + cover image. */
const LINK_AND_PRESENTATION: ProjectTypeRequirements = {
  value: 'PROJECT_WITH_LINK_AND_PRESENTATION',
  requiresDocumentation: true,
  requiresPresentation: true,
  requiresExternalUrl: true,
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

describe('getProjectSubmissionBlockers', () => {
  const complete = project({
    presentationUrl: 'projects/slides.pdf',
    externalUrl: 'https://github.com/team/repo',
  });

  it('reports no blockers for a complete project', () => {
    expect(getProjectSubmissionBlockers(complete, LINK_AND_PRESENTATION)).toEqual([]);
  });

  it('names every missing deliverable', () => {
    expect(
      getProjectSubmissionBlockers(
        project({ documentationUrl: null, coverImageUrl: '   ' }),
        LINK_AND_PRESENTATION
      )
    ).toEqual(['documentation', 'presentation', 'externalUrl', 'coverImage']);
  });

  it('names the missing cover image even when every selectable upload is there', () => {
    expect(
      getProjectSubmissionBlockers(
        project({
          presentationUrl: 'projects/slides.pdf',
          externalUrl: 'https://github.com/team/repo',
          coverImageUrl: null,
        }),
        LINK_AND_PRESENTATION
      )
    ).toEqual(['coverImage']);
  });

  it('rejects the pending_upload placeholder as an external link', () => {
    expect(
      getProjectSubmissionBlockers(
        project({ ...complete, externalUrl: 'pending_upload' }),
        LINK_AND_PRESENTATION
      )
    ).toEqual(['externalUrl']);
  });

  it('lists the deadline first when it has passed', () => {
    expect(
      getProjectSubmissionBlockers(complete, LINK_AND_PRESENTATION, {
        isSubmissionDeadlinePassed: true,
      })
    ).toEqual(['deadline']);
  });

  it('reports the author blockers the to-do list used to omit', () => {
    expect(
      getProjectSubmissionBlockers(
        project({
          ...complete,
          ProjectAuthors: [{ participationStatus: 'REQUESTED' }],
        } as unknown as Partial<ProjectRow>),
        LINK_AND_PRESENTATION
      )
    ).toEqual(['authorsPending', 'authorsNoneAccepted']);
  });

  it('reports the missing project type as the only blocker', () => {
    expect(getProjectSubmissionBlockers(complete, null)).toEqual(['type']);
  });
});

describe('getProjectSubmissionRequirements', () => {
  it('lists only the deliverables the type requires, plus the author row', () => {
    expect(
      getProjectSubmissionRequirements(project(), DOCUMENTATION_ONLY).map((r) => r.key)
    ).toEqual(['documentation', 'coverImage', 'authorsPending']);
  });

  it('marks satisfied and open requirements so the checklist can tick them off', () => {
    expect(
      getProjectSubmissionRequirements(
        project({ coverImageUrl: null }),
        DOCUMENTATION_ONLY
      )
    ).toEqual([
      { key: 'documentation', satisfied: true },
      { key: 'coverImage', satisfied: false },
      { key: 'authorsPending', satisfied: true },
    ]);
  });

  it('stays in sync with the blockers the submit button uses', () => {
    const row = project({ documentationUrl: null });
    expect(
      getProjectSubmissionRequirements(row, LINK_AND_PRESENTATION)
        .filter((r) => !r.satisfied)
        .map((r) => r.key)
    ).toEqual(getProjectSubmissionBlockers(row, LINK_AND_PRESENTATION));
  });
});
