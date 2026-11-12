import { render, screen } from '@testing-library/react';

import { LocationOption_enum } from '../../../../../__generated__/globalTypes';
import { SessionLocationChips, SessionLocationEntry } from '../SessionLocations';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

const entry = (option: LocationOption_enum, withAddress: boolean): SessionLocationEntry => ({
  key: option,
  option,
  courseLocationId: 1,
  address: withAddress ? ({ id: 1, address: '', CourseLocation: null } as never) : null,
});

describe('SessionLocationChips', () => {
  it('shows only the locations the session takes place at', () => {
    render(
      <SessionLocationChips
        entries={[entry(LocationOption_enum.ONLINE, true), entry(LocationOption_enum.KIEL, false)]}
      />
    );

    expect(screen.getByText('location.ONLINE')).toBeTruthy();
    expect(screen.queryByText('location.KIEL')).toBeNull();
  });
});
