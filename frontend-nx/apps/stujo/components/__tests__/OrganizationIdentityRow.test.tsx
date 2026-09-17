import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import OrganizationIdentityRow from '../OrganizationIdentityRow';
import type { EmployerOrganization } from '../../lib/useEmployerOrganization';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

// The dialog drags in MUI, Apollo and the shared uploader; this suite is about
// the row, so it stands in for the dialog with a marker.
jest.mock('../OrganizationProfileDialog', () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (open ? <div role="dialog">profile dialog</div> : null),
}));

const organization = (overrides: Partial<EmployerOrganization> = {}): EmployerOrganization =>
  ({
    id: 1,
    name: 'Nordwerk Maschinenbau GmbH',
    logo: null,
    website: null,
    ...overrides,
  } as EmployerOrganization);

const renderRow = (orgs: EmployerOrganization[], selected = orgs[0], onSelect = jest.fn()) => {
  render(
    <OrganizationIdentityRow
      organizations={orgs}
      organization={selected}
      onSelectOrganization={onSelect}
      onOrganizationUpdated={jest.fn()}
    />
  );
  return onSelect;
};

describe('OrganizationIdentityRow', () => {
  it('shows the stored website as an outbound link', () => {
    renderRow([organization({ website: 'https://www.example.de/jobs' })]);

    const link = screen.getByRole('link', { name: 'example.de/jobs' });
    expect(link).toHaveAttribute('href', 'https://www.example.de/jobs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  // A scheme-less value in an href would resolve against the current page.
  it('links a scheme-less legacy website absolutely', () => {
    renderRow([organization({ website: 'www.example.de' })]);

    expect(screen.getByRole('link', { name: 'example.de' })).toHaveAttribute(
      'href',
      'https://www.example.de'
    );
  });

  it('offers to add one when no website is stored', () => {
    renderRow([organization()]);

    expect(screen.queryByRole('link', { name: /example/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'organizationWebsite.none' })).toBeInTheDocument();
  });

  it('renders the company without artwork when there is no logo', () => {
    renderRow([organization()]);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Nordwerk Maschinenbau GmbH')).toBeInTheDocument();
  });

  it('names the logo after the company', () => {
    renderRow([organization({ logo: 'https://cdn.test/logo.png' })]);

    const logo = screen.getByRole('img');
    expect(logo).toHaveAttribute('src', 'https://cdn.test/logo.png');
    expect(logo).toHaveAccessibleName(
      'organizationProfile.logoAlt:{"organization":"Nordwerk Maschinenbau GmbH"}'
    );
  });

  it('falls back to the placeholder when the logo cannot be loaded', () => {
    renderRow([organization({ logo: 'https://cdn.test/gone.png' })]);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Nordwerk Maschinenbau GmbH')).toBeInTheDocument();
  });

  it('shows no picker for a single organization', () => {
    renderRow([organization()]);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('switches company by id, not by string', () => {
    const orgs = [organization(), organization({ id: 7, name: 'Nordwerk Service GmbH' })];
    const onSelect = renderRow(orgs);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '7' } });

    expect(onSelect).toHaveBeenCalledWith(7);
  });

  it('opens the profile dialog from the edit button', () => {
    renderRow([organization()]);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'organizationProfile.editButtonAria:{"organization":"Nordwerk Maschinenbau GmbH"}',
      })
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
