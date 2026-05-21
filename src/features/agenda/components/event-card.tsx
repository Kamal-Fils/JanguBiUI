'use client';

import { Calendar, MapPin, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { Event } from '../api/get-events';
import { useRegisterEvent } from '../api/register-event';

const EVENT_TYPE_LABELS: Record<string, string> = {
  mass: 'Messe',
  conference: 'Conférence',
  retreat: 'Retraite',
  ordination: 'Ordination',
  other: 'Autre',
};

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { mutate: register, isPending } = useRegisterEvent();

  const start = new Date(event.start_at);
  const end = new Date(event.end_at);

  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-800">{event.title}</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
          {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
        </span>
      </div>

      {event.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {event.description}
        </p>
      )}

      <div className="space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          <span>
            {start.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
            })}{' '}
            {start.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            –{' '}
            {end.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            <span>{event.location}</span>
          </div>
        )}
        {event.max_participants != null && (
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            <span>
              {event.registration_count} / {event.max_participants} inscrits
            </span>
          </div>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="mt-3 w-full"
        onClick={() => register(event.id)}
        disabled={isPending}
      >
        {isPending ? 'Inscription…' : "S'inscrire"}
      </Button>
    </div>
  );
}
