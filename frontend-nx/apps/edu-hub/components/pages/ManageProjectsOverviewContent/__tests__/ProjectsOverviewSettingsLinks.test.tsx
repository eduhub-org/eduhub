import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProjectsOverviewSettingsLinks from '../ProjectsOverviewSettingsLinks';

let mockIsAdmin = true;

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../../../../hooks/authentication', () => ({
  useIsAdmin: () => mockIsAdmin,
}));

describe('ProjectsOverviewSettingsLinks', () => {
  it('links Admins to the project types and documentation instructions settings', () => {
    mockIsAdmin = true;
    render(<ProjectsOverviewSettingsLinks />);

    expect(screen.getByRole('link', { name: /settings_links.project_types/ })).toHaveAttribute(
      'href',
      '/manage/settings/project-types'
    );
    expect(
      screen.getByRole('link', { name: /settings_links.documentation_instructions/ })
    ).toHaveAttribute('href', '/manage/settings/documentation-instructions');
  });

  it('shows nothing to anyone else', () => {
    mockIsAdmin = false;
    const { container } = render(<ProjectsOverviewSettingsLinks />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
