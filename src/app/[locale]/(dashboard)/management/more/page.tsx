'use client';

import { MoreMenu } from '@/components/management/mobile/MoreMenu';

/**
 * The mobile "More" menu route — grouped navigation for every module not on the
 * bottom tab bar, plus notifications and log out.
 * @returns The More page.
 */
export default function ManagementMorePage() {
  return (
    <div className="p-4">
      <MoreMenu />
    </div>
  );
}
