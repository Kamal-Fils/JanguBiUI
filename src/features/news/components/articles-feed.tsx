'use client';

import { Globe, MapPin, Church } from 'lucide-react';
import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useGlobalArticles, useParishArticles } from '../api/get-articles';

import { ArticleCard } from './article-card';

type Tab = 'global' | 'parish';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'global', label: 'Universel', icon: Globe },
  { id: 'parish', label: 'Ma paroisse', icon: Church },
];

function ArticlesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-border bg-card p-3"
        >
          <Skeleton className="size-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <MapPin className="size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        {tab === 'parish'
          ? 'Aucune actualité pour votre paroisse pour le moment.'
          : 'Aucune actualité disponible.'}
      </p>
    </div>
  );
}

function GlobalTab() {
  const { data, isLoading, isError } = useGlobalArticles({ limit: 20 });

  if (isLoading) return <ArticlesSkeleton />;
  if (isError)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Impossible de charger les actualités.
      </p>
    );
  if (!data?.results.length) return <EmptyState tab="global" />;

  return (
    <div className="flex flex-col gap-3">
      {data.results.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

function ParishTab() {
  const { data, isLoading, isError } = useParishArticles({ limit: 20 });

  if (isLoading) return <ArticlesSkeleton />;
  if (isError)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Impossible de charger les actualités de votre paroisse.
      </p>
    );
  if (!data?.results.length) return <EmptyState tab="parish" />;

  return (
    <div className="flex flex-col gap-3">
      {data.results.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}

export function ArticlesFeed() {
  const [activeTab, setActiveTab] = useState<Tab>('global');

  return (
    <div className="flex flex-col">
      <PageHeader title="Actualités" subtitle="La vie de l'Église" />

      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl md:max-w-3xl lg:max-w-5xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 py-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        {activeTab === 'global' ? <GlobalTab /> : <ParishTab />}
      </div>
    </div>
  );
}
