import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { DetailError, DetailList, DetailLoading, DetailRow } from './detail';

describe('DetailRow rows', () => {
  it('renders the label and value', async () => {
    const screen = await render(
      <DetailList>
        <DetailRow label="Status" value="Active" />
      </DetailList>,
    );
    await expect.element(screen.getByText('Status')).toBeInTheDocument();
    await expect.element(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows a -- placeholder for empty values', async () => {
    const screen = await render(
      <DetailList>
        <DetailRow label="Notes" value={null} />
      </DetailList>,
    );
    await expect.element(screen.getByText('--')).toBeInTheDocument();
  });

  it('renders nothing when empty and hideEmpty is set', async () => {
    const screen = await render(
      <DetailList>
        <DetailRow label="Notes" value={null} hideEmpty />
      </DetailList>,
    );
    expect(screen.container.querySelector('dt')).toBeNull();
  });
});

describe('DetailError state', () => {
  it('renders the provided message', async () => {
    const screen = await render(<DetailError message="Payment not found" />);
    await expect.element(screen.getByText('Payment not found')).toBeInTheDocument();
  });
});

describe('DetailLoading state', () => {
  it('renders the requested number of skeleton cards', async () => {
    const screen = await render(<DetailLoading cards={3} />);
    const cards = screen.container.querySelectorAll('[data-slot="card"]');
    expect(cards).toHaveLength(3);
  });
});
