import { jest } from '@jest/globals';

const profileRequest = (sessionVariables, userid = 'user-a') => ({
  headers: {
    bucket: 'test-bucket',
    'file-path': 'users/user-${userid}/public/profile_image/${filename}',
    'is-public': 'true',
  },
  body: {
    session_variables: sessionVariables,
    input: { base64file: 'aGVsbG8=', filename: 'me.png', userid },
  },
});

describe('saveImage', () => {
  let saveImage;
  let saveToBucketMock;

  beforeAll(async () => {
    jest.unstable_mockModule('../../index.js', () => ({
      logger: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
    }));
    jest.unstable_mockModule('@google-cloud/storage', () => ({ Storage: jest.fn() }));
    jest.unstable_mockModule('../../lib/cloud-storage.js', () => ({
      buildCloudStorage: () => ({ saveToBucket: (...args) => saveToBucketMock(...args) }),
    }));

    saveImage = (await import('../index.js')).default;
  });

  beforeEach(() => {
    saveToBucketMock = jest.fn().mockResolvedValue('https://storage.example/file');
  });

  it('saves a profile image into the caller\'s own folder', async () => {
    const result = await saveImage(profileRequest({ 'x-hasura-role': 'user', 'x-hasura-user-id': 'user-a' }));

    expect(result.success).toBe(true);
    expect(saveToBucketMock).toHaveBeenCalledWith(
      'users/user-user-a/public/profile_image/me.png',
      'test-bucket',
      expect.any(String),
      'true'
    );
  });

  it('refuses a profile image for another user', async () => {
    const result = await saveImage(
      profileRequest({ 'x-hasura-role': 'user', 'x-hasura-user-id': 'user-b' }, 'user-a')
    );

    expect(result).toEqual(expect.objectContaining({ success: false, messageKey: 'UNAUTHORIZED' }));
    expect(saveToBucketMock).not.toHaveBeenCalled();
  });

  it('refuses a profile image without a session user', async () => {
    const result = await saveImage(profileRequest(undefined));

    expect(result.messageKey).toBe('UNAUTHORIZED');
    expect(saveToBucketMock).not.toHaveBeenCalled();
  });

  it('lets admins save a profile image for another user', async () => {
    const result = await saveImage(
      profileRequest({ 'x-hasura-role': 'admin', 'x-hasura-user-id': 'user-b' }, 'user-a')
    );

    expect(result.success).toBe(true);
  });
});
