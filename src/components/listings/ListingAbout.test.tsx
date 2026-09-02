import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { ListingAbout } from './ListingAbout';

const messages = {
  ListingDetail: {
    about: 'About this home',
  },
};

async function renderAbout(text: string) {
  return await render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ListingAbout text={text} />
    </NextIntlClientProvider>,
  );
}

describe(ListingAbout, () => {
  it('renders section title and rich formatted content', async () => {
    const screen = await renderAbout(
      '<h3>Modern Apartment</h3><p>Includes <strong>renovated</strong> interior and <em>quiet</em> area.</p><ul><li>First feature</li><li>Second feature</li></ul>',
    );

    await expect.element(screen.getByRole('heading', { name: 'About this home' })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'Modern Apartment' })).toBeVisible();
    await expect.element(screen.getByText('First feature')).toBeVisible();
    await expect.element(screen.getByText('Second feature')).toBeVisible();
  });

  it('sanitizes unsafe tags and attributes', async () => {
    const screen = await renderAbout(
      '<p>Safe text</p><script>alert("xss")</script><iframe src="https://evil.com"></iframe><p style="color: red">Styled text</p>',
    );

    await expect.element(screen.getByText('Safe text')).toBeVisible();
    await expect.element(screen.getByText('Styled text')).toBeVisible();
    expect(screen.container.querySelectorAll('script')).toHaveLength(0);
    expect(screen.container.querySelectorAll('iframe')).toHaveLength(0);
  });

  it('renders permanently expanded without read more buttons', async () => {
    const screen = await renderAbout('<p>Full description paragraph content.</p>');

    await expect.element(screen.getByText('Full description paragraph content.')).toBeVisible();
    expect(screen.container.querySelectorAll('button')).toHaveLength(0);
  });
});
