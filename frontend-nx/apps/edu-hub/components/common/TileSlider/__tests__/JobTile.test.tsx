import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobTile } from '../JobTile';
import type { JobTileFragment } from '../../../../queries/__generated__/JobTileFragment';
import { JobPostingType_enum, JobOccupation_enum, JobRegion_enum } from '../../../../__generated__/globalTypes';

// The next-intl mock returns the key verbatim, so translated labels assert on
// their key (e.g. "type.INTERNSHIP"), matching the existing test conventions.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'de',
}));

const mockJob: JobTileFragment = {
  __typename: 'JobPosting',
  id: 1,
  title: 'Working Student Frontend',
  type: JobPostingType_enum.INTERNSHIP,
  occupation: JobOccupation_enum.IT_TELECOMMUNICATIONS,
  location: 'Kiel',
  region: JobRegion_enum.KIEL,
  featured: false,
  publishedAt: '2025-03-01T10:00:00Z',
  Organization: {
    __typename: 'Organization',
    id: 42,
    name: 'Acme GmbH',
    logo: null,
  },
};

describe('JobTile', () => {
  it('renders the title, company, translated type chip and location', () => {
    render(<JobTile job={mockJob} />);

    expect(screen.getByText('Working Student Frontend')).toBeInTheDocument();
    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();
    expect(screen.getByText('type.INTERNSHIP')).toBeInTheDocument();
    expect(screen.getByText('Kiel, region.KIEL')).toBeInTheDocument();
  });

  it('links to the Stujo detail page in a new tab', () => {
    render(<JobTile job={mockJob} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('/stellenangebote/1?utm_source=eduhub'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows the Stujo sign', () => {
    render(<JobTile job={mockJob} />);

    expect(screen.getByAltText('StuJo')).toBeInTheDocument();
  });
});
