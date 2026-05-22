'use client';

import { useState } from 'react';

import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';

import { CreateEventInput, useCreateEvent } from '../api/create-event';

const EVENT_TYPES = [
  { value: 'mass', label: 'Messe' },
  { value: 'conference', label: 'Conférence' },
  { value: 'retreat', label: 'Retraite' },
  { value: 'ordination', label: 'Ordination' },
  { value: 'other', label: 'Autre' },
];

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

interface EventFormProps {
  onSuccess?: () => void;
}

export function EventForm({ onSuccess }: EventFormProps) {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('mass');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [dateError, setDateError] = useState('');

  const { mutate: createEvent, isPending } = useCreateEvent({
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Événement créé',
        message: 'L\'événement a été publié.',
      });
      setTitle('');
      setDescription('');
      setStartAt('');
      setEndAt('');
      setLocation('');
      setMaxParticipants('');
      setDateError('');
      onSuccess?.();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !startAt || !endAt || !location) return;
    if (endAt <= startAt) {
      setDateError('La date de fin doit être après la date de début.');
      return;
    }
    setDateError('');

    const payload: CreateEventInput = {
      title: title.trim(),
      description: description.trim(),
      event_type: eventType,
      start_at: startAt,
      end_at: endAt,
      location: location.trim(),
      max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
    };
    createEvent(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Titre *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="Messe de Pentecôte, Retraite paroissiale…"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Type</label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className={inputClass}
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Détails de l'événement…"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Début *</label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Fin *</label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => { setEndAt(e.target.value); setDateError(''); }}
            className={inputClass}
            required
          />
        </div>
      </div>
      {dateError && (
        <p className="text-xs text-destructive">{dateError}</p>
      )}

      <div>
        <label className={labelClass}>Lieu *</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
          placeholder="Église Saint-Jean, Salle paroissiale…"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Participants max (optionnel)</label>
        <input
          type="number"
          min="1"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          className={inputClass}
          placeholder="Illimité si vide"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !title || !startAt || !endAt || !location}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending && <Spinner className="size-4" />}
        Publier l'événement
      </button>
    </form>
  );
}
