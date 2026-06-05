import { use } from 'react';

import { EventDetail } from '@/features/agenda/components/event-detail';

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default function EventPage({ params }: EventPageProps) {
  const { id } = use(params);
  return <EventDetail eventId={Number(id)} />;
}
