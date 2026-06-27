'use client';

import { AuthProvider } from '@/libs/auth';

/**
 * The wizard needs auth context (OWNER-gated); the marketing tree doesn't provide it.
 * @param props - The wrapped route children.
 * @returns The children wrapped in an AuthProvider.
 */
export default function ListPropertyLayout(props: { children: React.ReactNode }) {
  return <AuthProvider>{props.children}</AuthProvider>;
}
