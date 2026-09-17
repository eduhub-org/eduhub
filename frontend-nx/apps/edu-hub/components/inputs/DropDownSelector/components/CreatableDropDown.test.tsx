import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CreatableDropDown } from './CreatableDropDown';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('CreatableDropDown', () => {
  it('reports an empty string when its text is cleared', () => {
    const onInputChange = jest.fn();
    const onValueChange = jest.fn();

    render(
      <CreatableDropDown
        inputValue="Acme GmbH"
        localValue=""
        variant="eduhub"
        localOptions={[]}
        onInputChange={onInputChange}
        onValueChange={onValueChange}
        getLabelForValue={() => ''}
      />
    );

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });

    expect(onInputChange).toHaveBeenCalledWith('');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0].target.value).toBe('');
  });
});
