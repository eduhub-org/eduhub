import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectPreviewLayout from '../ProjectPreviewLayout';
import { ProjectRow } from '../types';

// Keys are asserted directly — the wording lives in the locale files.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const project = {
  id: 7,
  title: 'Solar',
  tagline: null,
  description: null,
  coverImageUrl: null,
  documentationUrl: null,
  presentationUrl: null,
  externalUrl: null,
  ProjectAuthors: [],
} as unknown as ProjectRow;

describe('ProjectPreviewLayout project page link', () => {
  it('links to the project page when a href is given', () => {
    render(<ProjectPreviewLayout project={project} showResourceLinks={false} projectPageHref="/course/3/project/7" />);

    expect(screen.getByRole('link', { name: 'projects.table.open_project_page' })).toHaveAttribute(
      'href',
      '/course/3/project/7'
    );
  });

  it('shows no project page link without a href', () => {
    render(<ProjectPreviewLayout project={project} showResourceLinks={false} />);

    expect(screen.queryByRole('link', { name: 'projects.table.open_project_page' })).not.toBeInTheDocument();
  });
});
