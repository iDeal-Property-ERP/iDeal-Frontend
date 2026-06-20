'use client';

import { use, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DetailCard,
  DetailError,
  DetailGrid,
  DetailList,
  DetailLoading,
  DetailRow,
} from '@/components/ui/detail';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { roleVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { UserOutput } from '@/types/management';

/**
 * Detail view for a single management user with an edit action.
 * @param props - Page props containing the route params.
 * @returns User detail page.
 */
export default function UserDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [user, setUser] = useState<UserOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<UserOutput>(`/management/users/${params.id}/`)
      .then(setUser)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <DetailLoading />;
  }
  if (!user) {
    return <DetailError message="User not found" />;
  }

  const fullName = `${user.first_name} ${user.last_name}${
    user.patronymic ? ` ${user.patronymic}` : ''
  }`.trim();

  return (
    <>
      <PageHeader
        title={fullName || user.username}
        backHref="/management/users"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/management/users/${params.id}/edit`);
            }}
          >
            Edit
          </Button>
        }
      />
      <DetailGrid>
        <DetailCard title="Account">
          <DetailList>
            <DetailRow label="Username" value={user.username} />
            <DetailRow label="Email" value={user.email} />
            <DetailRow label="Phone" value={user.phone} />
            <DetailRow
              label="Role"
              value={<Badge variant={roleVariant(user.role)}>{user.role}</Badge>}
            />
          </DetailList>
        </DetailCard>
        <DetailCard title="Status">
          <DetailList>
            <DetailRow
              label="Active"
              value={
                <Badge variant={user.is_active ? 'success' : 'danger'}>
                  {user.is_active ? 'Yes' : 'No'}
                </Badge>
              }
            />
            <DetailRow
              label="Verified"
              value={
                <Badge variant={user.is_verified ? 'success' : 'danger'}>
                  {user.is_verified ? 'Yes' : 'No'}
                </Badge>
              }
            />
            <DetailRow label="Nationality" value={user.nationality} />
          </DetailList>
        </DetailCard>
      </DetailGrid>
    </>
  );
}
