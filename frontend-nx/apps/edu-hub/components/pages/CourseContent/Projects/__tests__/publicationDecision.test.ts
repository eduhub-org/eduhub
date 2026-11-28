import {
  ProjectParticipationStatus_enum,
  ProjectStatus_enum,
} from '../../../../../__generated__/globalTypes';
import {
  PROJECT_TYPE_ONLINE_COURSE,
  canPublishProject,
  getPublicationDecision,
  hasPublicationConsent,
} from '../projectStatusDisplay';

describe('getPublicationDecision', () => {
  const submitted = { status: ProjectStatus_enum.SUBMITTED, type: 'CLASSIC_PROJECT' };

  it('has no decision before submission', () => {
    expect(getPublicationDecision({ status: ProjectStatus_enum.ONGOING, ProjectConsentEvents: [] })).toBeNull();
  });

  it('reads a granted latest event as approved', () => {
    expect(getPublicationDecision({ ...submitted, ProjectConsentEvents: [{ eventType: 'granted' }] })).toBe(
      'granted'
    );
  });

  it('treats no event or a withdrawal after submission as declined', () => {
    expect(getPublicationDecision({ ...submitted, ProjectConsentEvents: [] })).toBe('declined');
    expect(
      getPublicationDecision({ status: ProjectStatus_enum.COMPLETED, ProjectConsentEvents: [{ eventType: 'withdrawn' }] })
    ).toBe('declined');
  });

  it('keeps the decision after a submission was reviewed as incomplete', () => {
    expect(
      getPublicationDecision({ status: ProjectStatus_enum.INCOMPLETE, ProjectConsentEvents: [{ eventType: 'granted' }] })
    ).toBe('granted');
  });

  it('has no decision for online courses, which never ask for consent', () => {
    expect(getPublicationDecision({ ...submitted, type: PROJECT_TYPE_ONLINE_COURSE, ProjectConsentEvents: [] })).toBeNull();
  });
});

describe('hasPublicationConsent', () => {
  it('is true only when the latest consent event is a grant', () => {
    expect(hasPublicationConsent({ ProjectConsentEvents: [{ eventType: 'granted' }] })).toBe(true);
    expect(hasPublicationConsent({ ProjectConsentEvents: [{ eventType: 'withdrawn' }] })).toBe(false);
    expect(hasPublicationConsent({ ProjectConsentEvents: [] })).toBe(false);
    expect(hasPublicationConsent({ ProjectConsentEvents: null })).toBe(false);
  });
});

describe('canPublishProject', () => {
  const accepted = [{ participationStatus: ProjectParticipationStatus_enum.ACCEPTED }];
  const passed = { status: ProjectStatus_enum.COMPLETED, ProjectAuthors: accepted };

  it('allows a project whose team granted consent', () => {
    expect(canPublishProject({ ...passed, ProjectConsentEvents: [{ eventType: 'granted' }] })).toBe(true);
  });

  it('refuses a project without consent, or whose team withdrew it', () => {
    expect(canPublishProject({ ...passed, ProjectConsentEvents: [] })).toBe(false);
    expect(canPublishProject({ ...passed, ProjectConsentEvents: [{ eventType: 'withdrawn' }] })).toBe(false);
  });

  it('always allows an open Project Template, which has no team to ask', () => {
    expect(canPublishProject({ status: ProjectStatus_enum.PROPOSED, ProjectAuthors: [], ProjectConsentEvents: [] })).toBe(
      true
    );
  });

  it('asks for consent once a proposed project has a team', () => {
    expect(
      canPublishProject({ status: ProjectStatus_enum.PROPOSED, ProjectAuthors: accepted, ProjectConsentEvents: [] })
    ).toBe(false);
  });
});
