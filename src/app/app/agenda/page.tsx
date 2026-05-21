'use client';

import { useState } from 'react';

import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';

const EVENT_TYPES = [
  { value: '', label: 'Tous' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

export default function AgendaPage() {
  const [selectedType, setSelectedType] = useState('');
  const { data, isLoading, isError } = useEvents(
    selectedType ? { event_type: selectedType } : undefined,
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Agenda</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {EVENT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedType === type.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 text-center py-8">Chargement…</p>
      )}

      {isError && (
        <p className="text-sm text-red-500 text-center py-8">
          Erreur lors du chargement des événements.
        </p>
      )}

      {data && data.results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          Aucun événement à venir.
        </p>
      )}

      {data && data.results.length > 0 && (
        <div className="space-y-4">
          {data.results.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
