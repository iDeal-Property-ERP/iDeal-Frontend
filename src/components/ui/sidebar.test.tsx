import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { SidebarInset } from './sidebar';
import '@/styles/global.css';

describe(SidebarInset, () => {
  it('shrinks beside the sidebar without clipping scrollable content', async () => {
    const screen = await render(
      <div style={{ display: 'flex', width: 600 }}>
        <aside style={{ width: 200, flexShrink: 0 }}>Sidebar</aside>
        <SidebarInset>
          <div data-testid="content" style={{ overflowX: 'auto' }}>
            <div style={{ width: 800 }}>Wide dashboard content</div>
          </div>
        </SidebarInset>
      </div>,
    );
    const inset = screen.getByRole('main').element();
    const content = screen.getByTestId('content').element();

    expect(inset.clientWidth).toBe(400);
    expect(getComputedStyle(inset).overflowX).toBe('visible');
    expect(content.clientWidth).toBe(400);
    expect(content.scrollWidth).toBe(800);
    content.scrollLeft = 400;
    expect(content.scrollLeft).toBe(400);
  });
});
