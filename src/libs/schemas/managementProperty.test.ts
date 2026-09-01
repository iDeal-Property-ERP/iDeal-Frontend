import { describe, expect, it } from 'vitest';
import { managementPropertyDraftSchema } from './managementProperty';

describe('managementPropertyDraftSchema landmark validation', () => {
  it('accepts valid multilingual translations including landmark', () => {
    const result = managementPropertyDraftSchema.safeParse({
      translations: {
        en: { landmark: 'Near Metro' },
        uz: { landmark: 'Metro yaqinida' },
        ru: { landmark: 'Рядом с метро' },
      },
    });
    expect(result.success).toBeTruthy();
  });

  it('accepts undefined, empty, or valid landmark up to 5 words and 100 characters', () => {
    expect(managementPropertyDraftSchema.safeParse({ landmark: '' }).success).toBeTruthy();
    expect(
      managementPropertyDraftSchema.safeParse({ landmark: 'Near Grand Mir Hotel' }).success,
    ).toBeTruthy();
    expect(
      managementPropertyDraftSchema.safeParse({ landmark: 'One two three four five' }).success,
    ).toBeTruthy();
  });

  it('rejects landmark with more than 5 words', () => {
    const result = managementPropertyDraftSchema.safeParse({
      landmark: 'One two three four five six',
    });
    expect(result.success).toBeFalsy();
    expect(result.error?.issues[0]?.message).toBe('Landmark cannot exceed 5 words');
  });

  it('rejects landmark longer than 100 characters', () => {
    const longWord = 'a'.repeat(25);
    const result = managementPropertyDraftSchema.safeParse({
      landmark: `${longWord} ${longWord} ${longWord} ${longWord} ${longWord}`, // 5 words, 129 chars
    });
    expect(result.success).toBeFalsy();
  });
});
