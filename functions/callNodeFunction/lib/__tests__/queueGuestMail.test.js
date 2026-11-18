import { describe, expect, it, jest } from '@jest/globals';
import { queueGuestMail } from '../queueEmail.js';

const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
const template = {
  subject: 'Hi [User:FirstName] <3',
  content: '<p>[User:FirstName]: [Guest:ConfirmLink]</p>',
  from: null,
  cc: 'cc@example.com',
  bcc: 'bcc@example.com',
};

const clientWith = (insert) => ({
  request: jest.fn(async (document, variables) => {
    if (variables?.subject !== undefined) return insert(variables);
    return { MailTemplate: [template] };
  }),
});

describe('queueGuestMail', () => {
  it('renders the default template and keeps its copies', async () => {
    let inserted;
    const client = clientWith((variables) => {
      inserted = variables;
      return { insert_MailLog_one: { id: 7 } };
    });

    const result = await queueGuestMail(client, logger, {
      templateType: 'GUEST_REGISTRATION_CONFIRM',
      to: 'guest@example.com',
      values: { '[User:FirstName]': '<Ann>', '[Guest:ConfirmLink]': 'https://x/?a=1&b=2' },
      metadata: { type: 'GUEST_REGISTRATION_CONFIRM', courseId: 3 },
    });

    expect(result).toMatchObject({ success: true, mailId: 7 });
    expect(client.request.mock.calls[0][1]).toEqual({ type: 'GUEST_REGISTRATION_CONFIRM' });
    expect(inserted).toEqual({
      subject: 'Hi <Ann> <3',
      content: '<p>&lt;Ann&gt;: https://x/?a=1&amp;b=2</p>',
      from: 'noreply@opencampus.sh',
      to: 'guest@example.com',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
      status: 'READY_TO_SEND',
      metadata: { type: 'GUEST_REGISTRATION_CONFIRM', courseId: 3 },
    });
  });

  it('throws when the insert fails', async () => {
    const client = clientWith(() => {
      throw new Error('insert failed');
    });
    await expect(
      queueGuestMail(client, logger, { templateType: 'T', to: 'guest@example.com', values: {} })
    ).rejects.toThrow('insert failed');
  });
});
