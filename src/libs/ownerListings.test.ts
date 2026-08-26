import { describe, expect, it } from 'vitest';
import { prepareOwnerListingUpload } from './ownerListings';

describe('owner listing upload preparation helper', () => {
  it('aligns new submission captions to every uploaded file', () => {
    const first = new File(['first'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' });

    const result = prepareOwnerListingUpload(
      [
        { file: first, caption: 'Front' },
        { file: second, caption: 'Kitchen' },
      ],
      false,
    );

    expect(result).toStrictEqual({
      images: [first, second],
      captions: ['Front', 'Kitchen'],
    });
  });

  it('aligns rejected resubmission captions only to new files', () => {
    const first = new File(['first'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' });

    const result = prepareOwnerListingUpload(
      [
        { caption: 'Retained server photo' },
        { file: first, caption: 'New bedroom' },
        { caption: 'Another retained photo' },
        { file: second, caption: 'New balcony' },
      ],
      true,
    );

    expect(result).toStrictEqual({
      images: [first, second],
      captions: ['New bedroom', 'New balcony'],
    });
  });
});
