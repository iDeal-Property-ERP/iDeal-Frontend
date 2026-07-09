'use client';

import { NotificationsMobileView } from '@/components/management/mobile/NotificationsMobileView';

/**
 * The mobile Notifications route — reached from the More menu and the
 * notification bell. Renders the full-screen notifications list.
 * @returns The notifications page.
 */
export default function ManagementNotificationsPage() {
  return (
    <div className="p-4">
      <NotificationsMobileView />
    </div>
  );
}
