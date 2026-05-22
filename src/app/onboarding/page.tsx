'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { paths } from '@/config/paths';
import { useSelectParish } from '@/features/org/api/update-parish';
import { ParishSelector } from '@/features/org/components/parish-selector';
import { useUser } from '@/lib/auth';
import { getRoleHomePath } from '@/lib/get-role-home-path';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const [selectedParishId, setSelectedParishId] = useState<number | null>(null);

  const { mutate: selectParish, isPending } = useSelectParish({
    onSuccess: () => {
      router.replace(getRoleHomePath(user));
    },
  });

  if (user && user.onboarding_state === 'completed') {
    router.replace(getRoleHomePath(user));
    return null;
  }

  const handleSubmit = () => {
    if (!selectedParishId) return;
    selectParish(selectedParishId);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="size-12 text-primary"
            >
              <rect x="10" y="2" width="4" height="20" rx="2" />
              <rect x="2" y="8" width="20" height="4" rx="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Bienvenue sur Jàngu Bi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sélectionnez votre paroisse pour personnaliser votre expérience
            spirituelle.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ParishSelector
            value={selectedParishId}
            onChange={setSelectedParishId}
            disabled={isPending}
          />

          <Button
            className="mt-6 w-full"
            onClick={handleSubmit}
            disabled={!selectedParishId || isPending}
          >
            {isPending ? 'Enregistrement…' : 'Commencer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
