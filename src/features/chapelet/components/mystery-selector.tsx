'use client';

import { Flower2, Play } from 'lucide-react';

import { AudioPlayer } from '@/components/ui/audio-player/audio-player';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { RosaryGroup } from '@/features/chapelet/api/get-rosary-groups';
import { cn } from '@/utils/cn';

interface MysterySelectorProps {
  todayGroup: RosaryGroup;
  groups: RosaryGroup[];
  selectedGroup: RosaryGroup;
  onSelectGroup: (g: RosaryGroup) => void;
  onStartGuide: () => void;
}

export function MysterySelector({
  todayGroup,
  groups,
  selectedGroup,
  onSelectGroup,
  onStartGuide,
}: MysterySelectorProps) {
  // Try to extract individual mystery names from the string
  type MysteryItem = string | { title: string };
  const mysteriesList: MysteryItem[] = Array.isArray(selectedGroup.mysteries)
    ? selectedGroup.mysteries
    : typeof selectedGroup.mysteries === 'string'
      ? selectedGroup.mysteries
          .split(/\r?\n|,/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const isSelected = group.id === selectedGroup.id;
          const isToday = group.id === todayGroup.id;
          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              aria-pressed={isSelected}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97] motion-reduce:active:scale-100',
                isSelected
                  ? 'bg-gold text-primary-foreground shadow-soft-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}
            >
              {group.name}
              {isToday && !isSelected && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-gold" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected mystery details */}
      <Card variant="feature" className="gap-0 py-0">
        <CardHeader className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 to-accent/15 text-gold ring-1 ring-gold/30">
              <Flower2 className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <CardEyebrow>Mystères du Rosaire</CardEyebrow>
              <CardTitle className="font-serif text-xl">
                Mystères {selectedGroup.name}
              </CardTitle>
            </div>
            {selectedGroup.id === todayGroup.id && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-gold/15 text-gold-ink hover:bg-gold/20"
              >
                Aujourd&apos;hui
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 p-0">
          <div className="hairline-gold mx-5" aria-hidden="true" />
          {mysteriesList.length > 0 ? (
            mysteriesList.map((mystery, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border/50 px-5 py-3.5 last:border-b-0"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/12 font-serif text-sm font-semibold text-gold-ink ring-1 ring-gold/20">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {typeof mystery === 'string' ? mystery : mystery.title}
                </span>
              </div>
            ))
          ) : (
            <div className="p-5 text-sm text-foreground">
              {typeof selectedGroup.mysteries === 'string'
                ? selectedGroup.mysteries
                : 'Aucun mystère disponible.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          variant="gold"
          onClick={onStartGuide}
          className="w-full"
          icon={<Play className="size-4" />}
        >
          Commencer le chapelet guidé
        </Button>
        {selectedGroup.audio_file && (
          <AudioPlayer
            src={selectedGroup.audio_file}
            title={`${selectedGroup.name} — Audio`}
          />
        )}
      </div>
    </div>
  );
}
