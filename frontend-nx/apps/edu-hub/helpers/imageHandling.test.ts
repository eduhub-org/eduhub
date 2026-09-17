import { getBackgroundImage, getTileImage } from './imageHandling';

const STORAGE_BUCKET_URL = 'http://preview.example.test:4001/emulated-bucket';
const COVER_IMAGE_PATH = 'courses/course-4/public/cover-image/cover_image.jpg';

describe('imageHandling', () => {
  const previousStorageBucketUrl = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
  const OriginalImage = global.Image;
  let requestedImageUrl = '';

  beforeAll(() => {
    process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = STORAGE_BUCKET_URL;

    class FailingImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        requestedImageUrl = value;
        Promise.resolve().then(() => this.onerror?.());
      }
    }

    global.Image = FailingImage as unknown as typeof Image;
  });

  afterAll(() => {
    global.Image = OriginalImage;
    if (previousStorageBucketUrl === undefined) {
      delete process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
    } else {
      process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL = previousStorageBucketUrl;
    }
  });

  it('resolves the original tile image through the storage URL when the resized image is unavailable', async () => {
    await expect(getTileImage(COVER_IMAGE_PATH)).resolves.toBe(
      `${STORAGE_BUCKET_URL}/${COVER_IMAGE_PATH}`
    );
    expect(requestedImageUrl).toBe(
      `${STORAGE_BUCKET_URL}/courses/course-4/public/cover-image/cover_image-460.webp`
    );
  });

  it('resolves the original background image through the storage URL when the resized image is unavailable', async () => {
    await expect(getBackgroundImage(COVER_IMAGE_PATH)).resolves.toBe(
      `${STORAGE_BUCKET_URL}/${COVER_IMAGE_PATH}`
    );
    expect(requestedImageUrl).toBe(
      `${STORAGE_BUCKET_URL}/courses/course-4/public/cover-image/cover_image-1024.webp`
    );
  });
});
