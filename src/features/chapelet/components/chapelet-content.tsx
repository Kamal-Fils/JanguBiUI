'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import {
  useRosaryGroups,
  RosaryGroup,
} from '@/features/chapelet/api/get-rosary-groups';
import { useRosaryToday } from '@/features/chapelet/api/get-rosary-today';

import { ChapeletGuide } from './chapelet-guide';
import { MysterySelector } from './mystery-selector';

export function ChapeletContent() {
  const { data: todayRosary, isLoading: isLoadingToday } = useRosaryToday();
  const { data: groups, isLoading: isLoadingGroups } = useRosaryGroups();

  const [selectedGroup, setSelectedGroup] = useState<RosaryGroup | null>(null);
  const [isGuideActive, setIsGuideActive] = useState(false);

  // Default to today's group if one hasn't been explicitly selected
  const activeGroup = selectedGroup || todayRosary?.day.group;

  useRegisterPageMeta({
    title: isGuideActive ? 'Chapelet Guide' : 'Mon Chapelet Quotidien',
    subtitle:
      isGuideActive && activeGroup
        ? `Mystères ${activeGroup.name}`
        : 'Priez avec un guide jour après jour',
  });

  if (isLoadingToday || isLoadingGroups) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!todayRosary || !groups || !activeGroup) {
    return null;
  }

  if (isGuideActive) {
    return (
      <div className="flex flex-col">
        <div className="mx-auto w-full max-w-3xl p-4">
          <ChapeletGuide
            group={activeGroup}
            todayRosary={todayRosary}
            onBack={() => setIsGuideActive(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-3xl p-4">
        <MysterySelector
          todayGroup={todayRosary.day.group}
          groups={groups}
          selectedGroup={activeGroup}
          onSelectGroup={setSelectedGroup}
          onStartGuide={() => setIsGuideActive(true)}
        />
      </div>
    </div>
  );
}
