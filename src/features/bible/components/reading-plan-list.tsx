'use client';

import { BookOpen, Calendar } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/lib/auth';
import { isPretre } from '@/lib/authorization';

import { useReadingPlans } from '../api/get-reading-plans';
import type { ReadingPlan } from '../api/get-reading-plans';

function PlanCard({ plan }: { plan: ReadingPlan }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 size-5 shrink-0 text-blue-500" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{plan.title}</h3>
          {plan.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {plan.description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <Calendar className="size-3" />
            <span>
              {new Date(plan.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReadingPlanList() {
  const { data: user } = useUser();
  const { data, isLoading, isError } = useReadingPlans();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500 text-center py-6">
        Erreur lors du chargement des plans.
      </p>
    );
  }

  const plans = data?.results ?? [];

  return (
    <div>
      {isPretre(user) && (
        <p className="text-xs text-blue-600 mb-3">
          En tant que prêtre, vous pouvez créer des plans de lecture depuis
          l&apos;API.
        </p>
      )}
      {plans.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          Aucun plan de lecture disponible.
        </p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
