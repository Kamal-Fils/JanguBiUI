'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  BadgeCheck,
  KeyRound,
  Loader2,
  LogOut,
  Palette,
  Church as ChurchIcon,
  ShieldAlert,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ThemeToggle } from '@/components/layouts/theme-toggle';
import { MembershipManager } from '@/components/org/membership-manager';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import { Link } from '@/components/ui/link/link';
import { useNotifications } from '@/components/ui/notifications';
import { RoleBadge } from '@/components/ui/role-badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { paths } from '@/config/paths';
import { useDeleteAccount, useLogout, useUser } from '@/lib/auth';
import { isClergy, isFidele } from '@/lib/authorization';
import { cn } from '@/utils/cn';

import {
  ChangePasswordInput,
  UpdateProfileInput,
  useChangePassword,
  useUpdateProfile,
} from '../api/update-profile';

// ── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Mot de passe actuel requis'),
    new_password: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
    confirm_new_password: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm_new_password'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ── Sub-components ───────────────────────────────────────────────────────────

/** Filet bleu — le bleu porte l'identité, l'or reste un accent (R4). */
const RULE_CLASS =
  'h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent';

/**
 * Section du profil : carte `sacred` avec surtitre majuscule (eyebrow), titre
 * serif et filet **bleu**. Le `<section>` + `<h2>` sont conservés pour rester
 * compatibles avec les tests (heading.closest('section')).
 */
function SectionCard({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card variant="sacred">
      <section className="space-y-4 p-5">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="text-secondary-foreground dark:text-primary"
              aria-hidden="true"
            >
              {icon}
            </span>
            <CardEyebrow>{eyebrow}</CardEyebrow>
          </div>
          <h2 className="font-serif text-lg font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <div className={RULE_CLASS} aria-hidden="true" />
        </header>
        {children}
      </section>
    </Card>
  );
}

// Champs de formulaire calibrés pour R3 : libellé à 14 px sur `foreground` (le
// gris clair sur blanc est banni), champ d'au moins 44 px de haut, valeur à
// 16 px — en dessous, iOS zoome automatiquement à la mise au point.
const inputClass =
  'block min-h-11 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelClass = 'block text-sm font-medium text-foreground mb-1.5';
const errorClass = 'mt-1 text-sm font-medium text-destructive';
const primaryButtonClass =
  'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft-sm transition-[background-color,box-shadow] hover:bg-primary/90 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50';

// ── Main component ───────────────────────────────────────────────────────────

export function ProfilContent() {
  const { addNotification } = useNotifications();
  const { data: user, isLoading } = useUser();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
    },
  });

  // Sync default values once user data arrives
  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.profile?.first_name ?? '',
        last_name: user.profile?.last_name ?? '',
        phone: user.profile?.phone ?? '',
      });
    }
  }, [user, resetProfile]);

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onTouched',
  });

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Profil mis à jour',
      });
    },
  });

  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangePassword({
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Succès',
          message: 'Mot de passe modifié.',
        });
        resetPassword();
      },
    });

  const { mutate: logout, isPending: isLoggingOut } = useLogout({
    onSuccess: () => {
      window.location.href = '/auth/login';
    },
  });

  const { mutate: deleteAccount, isPending: isDeletingAccount } =
    useDeleteAccount({
      onSuccess: () => {
        window.location.href = '/auth/login';
      },
    });

  function onProfileSubmit(data: ProfileFormValues) {
    const payload: UpdateProfileInput = {};
    if (data.first_name) payload.first_name = data.first_name;
    if (data.last_name) payload.last_name = data.last_name;
    if (data.phone) payload.phone = data.phone;
    updateProfile(payload);
  }

  function onPasswordSubmit(data: PasswordFormValues) {
    const payload: ChangePasswordInput = {
      current_password: data.current_password,
      new_password: data.new_password,
    };
    changePassword(payload);
  }

  if (isLoading) {
    return (
      <div
        className="flex h-full items-center justify-center py-20"
        role="status"
      >
        <Loader2
          className="size-8 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Chargement du profil…</span>
      </div>
    );
  }

  const displayName =
    [user?.profile?.first_name, user?.profile?.last_name]
      .filter(Boolean)
      .join(' ') || user?.email;

  return (
    <div className="mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-5xl">
      {/* En-tête : bandeau BLEU (l'identité domine) + portrait cerclé bleu,
          l'or n'intervient plus qu'en pointe du dégradé — un accent, pas le
          registre (DIRECTION.md R4). */}
      <header className="relative overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5" />
        <div className={RULE_CLASS} aria-hidden="true" />
        <div className="-mt-12 flex items-end gap-4 px-4 pb-5 md:px-6">
          <div className="rounded-full bg-gradient-to-br from-primary via-primary/70 to-accent/60 p-[3px] shadow-soft">
            <div className="rounded-full bg-background p-1">
              <UserAvatar
                name={
                  [user?.profile?.first_name, user?.profile?.last_name]
                    .filter(Boolean)
                    .join(' ') || null
                }
                email={user?.email}
                src={user?.profile?.avatar}
                size="xl"
                className="size-20 text-2xl"
              />
            </div>
          </div>
          <div className="min-w-0 pb-1.5">
            {/* Le nom EST le sujet de l'écran : il doit se voir sans lire (R2). */}
            <h1 className="truncate font-serif text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
              {displayName}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
            {user?.role && (
              <div className="mt-2">
                <RoleBadge role={user.pastoral_role ?? user.role} />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-8 md:px-6 lg:px-8">
        {/* Profile info section */}
        <SectionCard
          eyebrow="Compte"
          title="Informations personnelles"
          icon={<UserRound className="size-4" />}
        >
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-3"
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="first_name" className={labelClass}>
                  Prénom
                </label>
                <input
                  id="first_name"
                  className={inputClass}
                  {...registerProfile('first_name')}
                />
                {profileErrors.first_name && (
                  <p className={errorClass} role="alert">
                    {profileErrors.first_name.message}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="last_name" className={labelClass}>
                  Nom
                </label>
                <input
                  id="last_name"
                  className={inputClass}
                  {...registerProfile('last_name')}
                />
                {profileErrors.last_name && (
                  <p className={errorClass} role="alert">
                    {profileErrors.last_name.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Téléphone
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+221 77 000 00 00"
                className={inputClass}
                {...registerProfile('phone')}
              />
              {profileErrors.phone && (
                <p className={errorClass} role="alert">
                  {profileErrors.phone.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isUpdating || isProfileSubmitting}
              className={primaryButtonClass}
            >
              {isUpdating && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              Enregistrer
            </button>
          </form>
        </SectionCard>

        {/* Change password section */}
        <SectionCard
          eyebrow="Sécurité"
          title="Changer le mot de passe"
          icon={<KeyRound className="size-4" />}
        >
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="space-y-3"
          >
            <div>
              <label htmlFor="current_password" className={labelClass}>
                Mot de passe actuel
              </label>
              <input
                id="current_password"
                type="password"
                className={inputClass}
                {...registerPassword('current_password')}
              />
              {passwordErrors.current_password && (
                <p className={errorClass} role="alert">
                  {passwordErrors.current_password.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="new_password" className={labelClass}>
                Nouveau mot de passe
              </label>
              <input
                id="new_password"
                type="password"
                className={inputClass}
                {...registerPassword('new_password')}
              />
              {passwordErrors.new_password && (
                <p className={errorClass} role="alert">
                  {passwordErrors.new_password.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirm_new_password" className={labelClass}>
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="confirm_new_password"
                type="password"
                className={inputClass}
                {...registerPassword('confirm_new_password')}
              />
              {passwordErrors.confirm_new_password && (
                <p className={errorClass} role="alert">
                  {passwordErrors.confirm_new_password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className={primaryButtonClass}
            >
              {isChangingPassword && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              Modifier le mot de passe
            </button>
          </form>
        </SectionCard>

        {/* Mes églises — gestion des appartenances (Chantier 7b) */}
        {isFidele(user) && (
          <SectionCard
            eyebrow="Mes églises"
            title="Appartenances"
            icon={<ChurchIcon className="size-4" />}
          >
            <MembershipManager />
          </SectionCard>
        )}

        {/* Mon ministère — porte d'entrée de l'auto-déclaration de clergé.
            Un compte déjà reconnu clergé n'a rien à revendiquer. Sans ce point
            d'entrée l'écran existerait sans être atteignable, ce qui est
            exactement le défaut que l'auto-déclaration vient corriger. */}
        {!isClergy(user) && (
          <SectionCard
            eyebrow="Mon ministère"
            title="Je suis prêtre, diacre ou religieux"
            icon={<BadgeCheck className="size-4" />}
          >
            <p className="text-sm text-muted-foreground">
              Déclarez le rôle que vous exercez pour que votre autorité
              hiérarchique ouvre vos accès clergé.
            </p>
            <Link
              href={paths.app.profilClerge.getHref()}
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-primary underline underline-offset-4"
            >
              Déclarer mon ministère
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </SectionCard>
        )}

        {/* Apparence — bascule clair/sombre (ThemeToggle conservé) */}
        <SectionCard
          eyebrow="Apparence"
          title="Thème de l'application"
          icon={<Palette className="size-4" />}
        >
          <div className="rounded-xl border border-border/60 bg-background/60 p-1">
            <ThemeToggle variant="row" className="rounded-xl" />
          </div>
        </SectionCard>

        {/* Session section */}
        <SectionCard
          eyebrow="Session"
          title="Connexion"
          icon={<LogOut className="size-4" />}
        >
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Se déconnecter
            </button>
          </div>
        </SectionCard>

        {/* Danger zone */}
        <SectionCard
          eyebrow="Zone de danger"
          title="Supprimer le compte"
          icon={<ShieldAlert className="size-4 text-destructive" />}
        >
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:border-destructive/50 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Supprimer mon compte
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">
                Cette action est irréversible. Votre compte et toutes vos
                données seront supprimés.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-11 flex-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => deleteAccount()}
                  disabled={isDeletingAccount}
                  className={cn(
                    'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50',
                  )}
                >
                  {isDeletingAccount && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
