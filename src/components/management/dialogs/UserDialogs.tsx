'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inviteUser, updateUser, USER_ROLES } from '@/libs/management/usersAdapter';
import type { Role } from '@/types/enums';
import type { UserOutput } from '@/types/management';

/**
 * The "Invite user" dialog — first name, last name, email, phone, and a role
 * select (mgmt / owner / tenant / agent) → `inviteUser`. Errors surface as a
 * toast; on success it closes and notifies the caller to refetch.
 * @param props - Open state, change handler, and success callback.
 * @returns The invite-user dialog element.
 */
export function InviteUserDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('tenant');
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const roleLabel = (value: string): string => t(`usr_role_${value}` as 'usr_role_mgmt');

  const submit = async () => {
    if (!firstName || !email) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      const result = await inviteUser({
        first_name: firstName,
        last_name: lastName || undefined,
        email,
        phone: phone || undefined,
        role,
      });
      toast.success(t('usr_invited'));
      props.onSuccess();
      // Show the one-time temporary password for the manager to relay; the user
      // must change it on first login.
      setTempPassword(result.temporary_password);
    } catch {
      toast.error(t('usr_invite_failed'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setTempPassword(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('tenant');
    props.onOpenChange(false);
  };

  if (tempPassword) {
    return (
      <Dialog open={props.open} onOpenChange={close}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t('usr_invited')}</DialogTitle>
            <DialogDescription>{t('usr_temp_password_desc')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label>{t('usr_temp_password')}</Label>
            <code className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground select-all">
              {tempPassword}
            </code>
          </div>
          <DialogFooter>
            <Button onClick={close}>{t('usr_done')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('usr_invite')}</DialogTitle>
          <DialogDescription>{t('usr_invite_desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-first">{t('usr_field_first_name')} *</Label>
              <Input
                id="user-first"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-last">{t('usr_field_last_name')}</Label>
              <Input
                id="user-last"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-email">{t('usr_field_email')} *</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-phone">{t('usr_field_phone')}</Label>
            <Input
              id="user-phone"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('usr_field_role')} *</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {roleLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('usr_send_invite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The "Edit user" dialog — a role select plus verified / active toggles →
 * `updateUser`. Pre-fills from the selected user.
 * @param props - The user, open state, change handler, and success callback.
 * @returns The edit-user dialog element (or null with no user).
 */
export function EditUserDialog(props: {
  user: UserOutput | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations('Management');
  const { user } = props;
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'tenant');
  const [isVerified, setIsVerified] = useState(user?.is_verified ?? false);
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return null;
  }

  const roleLabel = (value: string): string => t(`usr_role_${value}` as 'usr_role_mgmt');

  const submit = async () => {
    if (!firstName || !email) {
      toast.error(t('dialog_fill_required'));
      return;
    }
    setBusy(true);
    try {
      await updateUser(user.id, {
        first_name: firstName,
        last_name: lastName || undefined,
        email,
        phone: phone || undefined,
        role,
        is_verified: isVerified,
        is_active: isActive,
      });
      toast.success(t('usr_updated'));
      props.onSuccess();
      props.onOpenChange(false);
    } catch {
      toast.error(t('usr_update_failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('usr_edit')}</DialogTitle>
          <DialogDescription>
            {t('usr_edit_desc', { name: `${user.first_name} ${user.last_name}`.trim() })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-user-first">{t('usr_field_first_name')} *</Label>
              <Input
                id="edit-user-first"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-user-last">{t('usr_field_last_name')}</Label>
              <Input
                id="edit-user-last"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-user-email">{t('usr_field_email')} *</Label>
            <Input
              id="edit-user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-user-phone">{t('usr_field_phone')}</Label>
            <Input
              id="edit-user-phone"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t('usr_field_role')}</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {roleLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={isVerified}
              onCheckedChange={(value) => setIsVerified(value === true)}
            />
            {t('usr_field_verified')}
          </label>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={isActive} onCheckedChange={(value) => setIsActive(value === true)} />
            {t('usr_field_active')}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {t('usr_save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
