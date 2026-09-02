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

  it('accepts valid uzbekistan contact phone numbers or empty strings', () => {
    expect(managementPropertyDraftSchema.safeParse({ contact_phone: '' }).success).toBeTruthy();
    expect(
      managementPropertyDraftSchema.safeParse({ contact_phone: '+998901234567' }).success,
    ).toBeTruthy();
    expect(
      managementPropertyDraftSchema.safeParse({ contact_phone: '+998 (90) 123-45-67' }).success,
    ).toBeTruthy();
    expect(
      managementPropertyDraftSchema.safeParse({ contact_phone: '998901234567' }).success,
    ).toBeTruthy();
  });

  it('rejects invalid contact phone numbers', () => {
    const result = managementPropertyDraftSchema.safeParse({
      contact_phone: '12345',
    });
    expect(result.success).toBeFalsy();
    expect(result.error?.issues[0]?.message).toBe(
      'Invalid Uzbekistan phone number (+998XXXXXXXXX)',
    );
  });
});
