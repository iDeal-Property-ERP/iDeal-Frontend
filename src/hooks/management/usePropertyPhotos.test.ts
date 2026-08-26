import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { usePropertyPhotos } from './usePropertyPhotos';

describe('usePropertyPhotos object URLs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps previews through updates and revokes them on removal', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue();
    const hook = await renderHook(() =>
      usePropertyPhotos(null, [], { uploadError: 'Upload failed' }),
    );
    const first = new File(['first'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' });

    await hook.act(async () => await hook.result.current.upload([first]));
    const firstId = hook.result.current.photos[0]?.id;

    await hook.act(() => hook.result.current.updateCaption?.(firstId ?? 0, 'Front'));
    await hook.act(async () => await hook.result.current.upload([second]));

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await hook.act(async () => await hook.result.current.remove(firstId ?? 0));

    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:first');
    expect(hook.result.current.photos.map((photo) => photo.image_url)).toStrictEqual([
      'blob:second',
    ]);
  });

  it('revokes remaining preview URLs on unmount', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:photo');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue();
    const hook = await renderHook(() =>
      usePropertyPhotos(null, [], { uploadError: 'Upload failed' }),
    );
    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

    await hook.act(async () => await hook.result.current.upload([file]));
    await hook.unmount();

    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:photo');
  });
});
