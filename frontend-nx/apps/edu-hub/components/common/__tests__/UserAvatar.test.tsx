import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import UserAvatar from '../UserAvatar';

const STORAGE_URL = 'https://storage.example/emulated-bucket';
const PICTURE = 'users/user-1/public/profile_image/portrait.png';
const expectImageSource = (image: HTMLElement, source: string) =>
  expect(decodeURIComponent(image.getAttribute('src') ?? '')).toContain(source);

describe('UserAvatar', () => {
  const previousStorageBucketUrl = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = STORAGE_URL;
  });

  afterAll(() => {
    if (previousStorageBucketUrl === undefined) {
      delete process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
    } else {
      process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = previousStorageBucketUrl;
    }
  });

  it('falls back from a missing resized image to the original', () => {
    render(<UserAvatar picture={PICTURE} imageSize={40} imageResolution={64} alt="Test user" />);

    const image = screen.getByRole('img', { name: 'Test user' });
    expectImageSource(image, `${STORAGE_URL}/users/user-1/public/profile_image/portrait-64.webp`);

    fireEvent.error(image);

    expectImageSource(image, `${STORAGE_URL}/${PICTURE}`);
  });

  it('uses the mystery avatar when neither stored image can be loaded', () => {
    render(<UserAvatar picture={PICTURE} imageSize={40} imageResolution={64} alt="Test user" />);

    const image = screen.getByRole('img', { name: 'Test user' });
    fireEvent.error(image);
    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/images/common/mystery.svg');
  });
});
