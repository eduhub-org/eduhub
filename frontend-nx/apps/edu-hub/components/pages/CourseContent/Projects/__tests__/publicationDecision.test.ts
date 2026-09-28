import { ProjectStatus_enum } from '../../../../../__generated__/globalTypes';
import { PROJECT_TYPE_ONLINE_COURSE, getPublicationDecision } from '../projectStatusDisplay';

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
