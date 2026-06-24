import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { parseSimpleFormattedText } from './parseSimpleFormattedText';

const renderFormatted = (text: string) => render(<>{parseSimpleFormattedText(text)}</>);

describe('parseSimpleFormattedText', () => {
  it('renders plain text', () => {
    renderFormatted('Bring your laptop.');
    expect(screen.getByText('Bring your laptop.')).toBeInTheDocument();
  });

  it('renders bold with double asterisks', () => {
    renderFormatted('Please bring **laptop**.');
    const bold = screen.getByText('laptop');
    expect(bold.tagName).toBe('STRONG');
  });

  it('renders italic with single asterisks', () => {
    renderFormatted('This is *optional*.');
    const italic = screen.getByText('optional');
    expect(italic.tagName).toBe('EM');
  });

  it('renders markdown links with safe https URLs', () => {
    renderFormatted('See [materials](https://example.com/docs).');
    const link = screen.getByRole('link', { name: 'materials' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders bare https URLs as links', () => {
    renderFormatted('Join at https://example.com/live');
    const link = screen.getByRole('link', { name: 'https://example.com/live' });
    expect(link).toHaveAttribute('href', 'https://example.com/live');
  });

  it('does not render unsafe markdown URLs as links', () => {
    const { container } = renderFormatted('[bad](javascript:alert(1))');
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('[bad](javascript:alert(1))');
  });

  it('preserves line breaks in text content', () => {
    const { container } = renderFormatted('Line one\nLine two');
    expect(container.textContent).toContain('Line one');
    expect(container.textContent).toContain('Line two');
  });
});
