'use client';

import Link from 'next/link';
import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useAdminUsers } from '@/features/users/api/get-admin-users';
import { useToggleUserActive } from '@/features/users/api/toggle-user-active';
import { useUser } from '@/lib/auth';
import { canManageUsers } from '@/lib/authorization';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  province_admin: 'Province',
  diocese_admin: 'Diocèse',
  parish_admin: 'Paroisse',
  church_admin: 'Église',
  fidele: 'Fidèle',
  pretre: 'Prêtre',
  diacre: 'Diacre',
  eveque: 'Évêque',
  archeveque: 'Archevêque',
  religieux: 'Religieux',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700',
  province_admin: 'bg-orange-100 text-orange-700',
  diocese_admin: 'bg-amber-100 text-amber-700',
  parish_admin: 'bg-yellow-100 text-yellow-700',
  church_admin: 'bg-lime-100 text-lime-700',
  pretre: 'bg-purple-100 text-purple-700',
  diacre: 'bg-violet-100 text-violet-700',
  eveque: 'bg-indigo-100 text-indigo-700',
  archeveque: 'bg-blue-100 text-blue-700',
  religieux: 'bg-teal-100 text-teal-700',
  fidele: 'bg-gray-100 text-gray-600',
};

const FILTER_ROLES = [
  { value: '', label: 'Tous' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'parish_admin', label: 'Paroisse' },
  { value: 'pretre', label: 'Prêtres' },
  { value: 'fidele', label: 'Fidèles' },
];

export default function AdminUsersPage() {
  const { data: currentUser } = useUser();
  const [roleFilter, setRoleFilter] = useState('');
  const { data, isLoading } = useAdminUsers(roleFilter || undefined);
  const { mutate: toggleActive } = useToggleUserActive();

  if (!canManageUsers(currentUser)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Utilisateurs" />
        <p className="p-4 text-sm text-red-500">Accès non autorisé.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Utilisateurs" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Filter + actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {FILTER_ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRoleFilter(r.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  roleFilter === r.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Link href={paths.app.admin.users.invite.getHref()}>
            <Button size="sm">+ Inviter clergé</Button>
          </Link>
        </div>

        {isLoading && (
          <p className="text-sm text-gray-400 text-center py-6">Chargement…</p>
        )}

        {data && data.results.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            Aucun utilisateur trouvé.
          </p>
        )}

        <ul className="space-y-2">
          {data?.results.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {u.user_profile
                    ? `${u.user_profile.first_name} ${u.user_profile.last_name}`.trim() ||
                      u.email
                    : u.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                {!u.is_active && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-500">
                    Inactif
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleActive(u.id)}
                  className={`rounded px-2 py-1 text-xs ${
                    u.is_active
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {u.is_active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            </li>
          ))}
        </ul>

        {data && data.count > data.results.length && (
          <p className="text-xs text-gray-400 text-center">
            {data.results.length} / {data.count} utilisateurs
          </p>
        )}
      </div>
    </div>
  );
}
