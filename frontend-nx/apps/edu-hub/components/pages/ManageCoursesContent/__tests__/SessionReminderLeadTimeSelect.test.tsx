import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import SessionReminderLeadTimeSelect from '../SessionReminderLeadTimeSelect';

const mockUpdate = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../../../../hooks/authedMutation', () => ({
  useManageMutation: () => [mockUpdate],
}));

jest.mock('../../../common/dialogs/NotificationSnackbar', () => () => null);

// A plain select stands in for the material dropdown, which only has to hand the chosen value on.
jest.mock('../../../inputs/DropDownSelector', () =>
  function MockDropDown({
    label,
    value,
    options,
    onValueUpdated,
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onValueUpdated: (value: string) => void;
  }) {
    return (
      <select aria-label={label} value={value} onChange={(event) => onValueUpdated(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

describe('SessionReminderLeadTimeSelect', () => {
  beforeEach(() => {
    mockUpdate.mockReset().mockResolvedValue({});
  });

  it('shows the course lead time, and "off" when there is none', () => {
    const { rerender } = render(<SessionReminderLeadTimeSelect courseId={7} leadHours={24} />);
    expect(screen.getByRole('combobox', { name: 'label' })).toHaveValue('24');

    rerender(<SessionReminderLeadTimeSelect courseId={7} leadHours={null} />);
    expect(screen.getByRole('combobox', { name: 'label' })).toHaveValue('OFF');
  });

  it('offers off plus the five lead times', () => {
    render(<SessionReminderLeadTimeSelect courseId={7} leadHours={24} />);
    expect(screen.getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual([
      'OFF',
      '2',
      '24',
      '48',
      '72',
      '168',
    ]);
  });

  it('saves the chosen hours as a number, and off as null', async () => {
    render(<SessionReminderLeadTimeSelect courseId={7} leadHours={24} />);
    const select = screen.getByRole('combobox', { name: 'label' });

    fireEvent.change(select, { target: { value: '168' } });
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ variables: { courseId: 7, leadHours: 168 } }));

    fireEvent.change(select, { target: { value: 'OFF' } });
    await waitFor(() => expect(mockUpdate).toHaveBeenLastCalledWith({ variables: { courseId: 7, leadHours: null } }));
  });
});
