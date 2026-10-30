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

  it('lists every option on focus even though the field shows the current selection', () => {
    const options = [
      { value: '0', label: 'EduHub Default' },
      { value: '1', label: 'opencampus.sh' },
    ];
    const Harness = () => {
      const [inputValue, setInputValue] = React.useState('');
      return (
        <CreatableDropDown
          inputValue={inputValue}
          localValue="0"
          variant="eduhub"
          localOptions={options}
          onInputChange={setInputValue}
          onValueChange={jest.fn()}
          getLabelForValue={(value) => options.find((option) => option.value === value)?.label ?? ''}
          allowCreate={false}
        />
      );
    };

    render(<Harness />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(input).toHaveValue('EduHub Default');
    expect(screen.getByText('opencampus.sh')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'open' } });

    expect(screen.getByText('opencampus.sh')).toBeInTheDocument();
    expect(screen.queryByText('EduHub Default')).not.toBeInTheDocument();
  });
});
