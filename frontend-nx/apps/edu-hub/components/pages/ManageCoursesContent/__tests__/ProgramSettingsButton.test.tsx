import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProgramSettingsButton from '../ProgramSettingsButton';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ProgramSettingsButton', () => {
  it('shows a visible label, not just an icon', () => {
    render(<ProgramSettingsButton open={false} onToggle={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'program_settings.open' })).toHaveTextContent('program_settings.open');
  });

  it('reports whether the settings are open and toggles them', () => {
    const onToggle = jest.fn();
    const { rerender } = render(<ProgramSettingsButton open={false} onToggle={onToggle} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<ProgramSettingsButton open onToggle={onToggle} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });
});
