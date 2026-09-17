import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ImageUploader from '../ImageUploader';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

jest.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }));

const mockMutate = jest.fn();
jest.mock('../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [mockMutate],
}));

// An absolute URL so getPublicUrl returns it verbatim: this suite is about the
// rendering, not about storage-path resolution.
const LOGO_URL = 'https://cdn.test/public/logo.png';

const renderLogoUploader = (currentFile: string | null, onFileUpdated = jest.fn()) => {
  render(
    <ImageUploader
      variant="material"
      element="organizationLogo"
      label="Firmenlogo"
      identifierVariables={{ organizationId: 7 }}
      currentFile={currentFile}
      onFileUpdated={onFileUpdated}
    />
  );
  return onFileUpdated;
};

describe('ImageUploader — organization logo', () => {
  beforeEach(() => mockMutate.mockReset());

  it('offers an upload target and nothing to remove when there is no logo', () => {
    renderLogoUploader(null);

    expect(screen.getByRole('button', { name: /image_uploader.add_logo/ })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'image_uploader.remove_logo' })
    ).not.toBeInTheDocument();
  });

  it('shows a stored logo uncropped, with change and remove controls', () => {
    renderLogoUploader(LOGO_URL);

    const logo = screen.getByRole('img');
    expect(logo).toHaveAttribute('src', LOGO_URL);
    // The reported defect: a wide wordmark must not be centre-cropped.
    expect(logo).toHaveClass('object-contain');
    expect(logo).not.toHaveClass('object-cover');
    expect(screen.getByRole('button', { name: 'image_uploader.change_logo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'image_uploader.remove_logo' })).toBeInTheDocument();
  });

  it('keeps the logo removable when the image cannot be loaded', () => {
    renderLogoUploader(LOGO_URL);

    fireEvent.error(screen.getByRole('img'));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('image_uploader.logo_unavailable')).toBeInTheDocument();
    // The regression that matters: a stored-but-broken logo used to leave no
    // control at all, so it could never be cleared.
    expect(screen.getByRole('button', { name: 'image_uploader.remove_logo' })).toBeInTheDocument();
  });

  it('shows a replacement logo after an earlier one failed', () => {
    const { rerender } = render(
      <ImageUploader
        variant="material"
        element="organizationLogo"
        identifierVariables={{ organizationId: 7 }}
        currentFile={LOGO_URL}
      />
    );
    fireEvent.error(screen.getByRole('img'));

    rerender(
      <ImageUploader
        variant="material"
        element="organizationLogo"
        identifierVariables={{ organizationId: 7 }}
        currentFile="https://cdn.test/public/other.png"
      />
    );

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://cdn.test/public/other.png');
  });

  it('gives the remove control a 44px touch target', () => {
    renderLogoUploader(LOGO_URL);

    expect(screen.getByRole('button', { name: 'image_uploader.remove_logo' })).toHaveStyle({
      width: '44px',
      height: '44px',
    });
  });

  it('opens the file picker from the placeholder and from the change control', () => {
    const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);

    const { unmount } = render(
      <ImageUploader
        variant="material"
        element="organizationLogo"
        identifierVariables={{ organizationId: 7 }}
        currentFile={null}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /image_uploader.add_logo/ }));
    expect(click).toHaveBeenCalledTimes(1);
    unmount();

    renderLogoUploader(LOGO_URL);
    fireEvent.click(screen.getByRole('button', { name: 'image_uploader.change_logo' }));
    expect(click).toHaveBeenCalledTimes(2);

    click.mockRestore();
  });

  it('removes the logo through the action and reports it upwards', async () => {
    mockMutate.mockResolvedValue({ data: { removeOrganizationLogo: { success: true } } });
    const onFileUpdated = renderLogoUploader(LOGO_URL);

    fireEvent.click(screen.getByRole('button', { name: 'image_uploader.remove_logo' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith({ variables: { organizationId: 7 } })
    );
    await waitFor(() => expect(onFileUpdated).toHaveBeenCalledWith(null));
  });

  it('explains a rejected removal in the caller-facing wording', async () => {
    mockMutate.mockResolvedValue({
      data: { removeOrganizationLogo: { success: false, messageKey: 'UNAUTHORIZED' } },
    });
    renderLogoUploader(LOGO_URL);

    fireEvent.click(screen.getByRole('button', { name: 'image_uploader.remove_logo' }));

    expect(
      await screen.findByText('image_uploader.logo_permission_denied')
    ).toBeInTheDocument();
  });
});

describe('ImageUploader — profile picture', () => {
  it('still renders a round, cropped avatar', () => {
    render(
      <ImageUploader
        variant="eduhub"
        element="profilePicture"
        identifierVariables={{ userId: 'u1' }}
        currentFile={null}
        user={{ picture: 'https://cdn.test/public/face.png' }}
      />
    );

    const avatar = screen.getByRole('img');
    expect(avatar).toHaveClass('rounded-full');
    expect(avatar).toHaveClass('object-cover');
  });
});
