import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { StatusChangeEmailNotice } from '../StatusChangeEmailNotice';
import { MailTemplateType_enum } from '../../../__generated__/globalTypes';

jest.mock('next-intl', () => ({
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, unknown>) =>
      `${namespace}.${key}${values ? JSON.stringify(values) : ''}`,
}));

const mockUseRoleQuery = jest.fn();
jest.mock('../../../hooks/authedQuery', () => ({
  useRoleQuery: (...args: unknown[]) => mockUseRoleQuery(...args),
}));

describe('StatusChangeEmailNotice', () => {
  beforeEach(() => {
    mockUseRoleQuery.mockReturnValue({ data: { MailTemplate: [{ id: 1, type: 'INVITE' }] } });
  });

  it('names the template and whether the course has its own version', () => {
    render(
      <StatusChangeEmailNotice
        courseId={7}
        emails={[
          { template: MailTemplateType_enum.INVITE, count: 2 },
          { template: MailTemplateType_enum.DECLINE, count: 1 },
        ]}
      />
    );

    const lines = screen.getAllByRole('listitem');
    expect(lines[0]).toHaveTextContent('"count":2');
    expect(lines[0]).toHaveTextContent('manageEmailTemplates.template_types.INVITE');
    expect(lines[0]).toHaveTextContent('common.status_email.course_version');
    expect(lines[1]).toHaveTextContent('common.status_email.default_version');
  });

  it('says when no email goes out and leaves out nobody', () => {
    render(
      <StatusChangeEmailNotice
        courseId={7}
        emails={[
          { template: null, count: 1 },
          { template: MailTemplateType_enum.INVITE, count: 0 },
        ]}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('common.status_email.none')).toBeInTheDocument();
  });

  it('names no version until the course templates are known', () => {
    mockUseRoleQuery.mockReturnValue({ data: undefined, loading: true });
    render(<StatusChangeEmailNotice courseId={7} emails={[{ template: MailTemplateType_enum.INVITE, count: 1 }]} />);

    const line = screen.getByRole('listitem');
    expect(line).toHaveTextContent('common.status_email.will_send_plain');
    expect(line).not.toHaveTextContent('default_version');
  });
});
