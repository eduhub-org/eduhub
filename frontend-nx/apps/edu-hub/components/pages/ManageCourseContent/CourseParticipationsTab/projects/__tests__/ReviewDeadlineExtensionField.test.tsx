import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewDeadlineExtensionField from '../ReviewDeadlineExtensionField';

// Keys are asserted directly — the wording lives in the locale files.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  useLocale: () => 'de',
}));

const setup = (
  props: Partial<React.ComponentProps<typeof ReviewDeadlineExtensionField>> = {}
) => {
  const onChoiceChange = jest.fn();
  const onCustomDateChange = jest.fn();
  render(
    <ReviewDeadlineExtensionField
      choice="custom"
      onChoiceChange={onChoiceChange}
      customDate=""
      onCustomDateChange={onCustomDateChange}
      effectiveDeadlineIso="2026-08-18"
      isDeadlinePassed
      {...props}
    />
  );
  return { onChoiceChange, onCustomDateChange };
};

const pickerInput = () =>
  document.querySelector('.optimistic-datepicker input') as HTMLInputElement | null;

describe('ReviewDeadlineExtensionField', () => {
  it('offers the custom date through the standard date picker, not a bare date input', () => {
    setup();

    // A `type="date"` input would be the browser's own widget; the app's
    // standard picker is react-datepicker with a text input it controls itself.
    expect(document.querySelector('input[type="date"]')).toBeNull();
    expect(pickerInput()).not.toBeNull();
  });

  it('opens the calendar and reports the picked day as yyyy-mm-dd', () => {
    const { onCustomDateChange } = setup({ customDate: '2026-09-10' });

    const input = pickerInput() as HTMLInputElement;
    fireEvent.focus(input);
    // The calendar popup is what makes this the standard picker.
    expect(document.querySelector('.react-datepicker')).not.toBeNull();

    const day15 = Array.from(
      document.querySelectorAll(
        '.react-datepicker__day:not(.react-datepicker__day--outside-month)'
      )
    ).find((el) => el.textContent === '15');
    expect(day15).toBeDefined();
    fireEvent.click(day15 as Element);

    expect(onCustomDateChange).toHaveBeenCalledWith('2026-09-15');
  });

  it('blocks days before today in the calendar', () => {
    setup({ customDate: '' });

    fireEvent.focus(pickerInput() as HTMLInputElement);

    expect(
      document.querySelectorAll('.react-datepicker__day--disabled').length
    ).toBeGreaterThan(0);
  });
});
