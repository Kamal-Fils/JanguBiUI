'use client';

import { useGetConversation } from '@/features/messaging/api/get-conversation';
import { ChatWindow } from '@/features/messaging/components/chat-window';
import { useUser } from '@/lib/auth';

interface ConversationPageProps {
  params: { id: string };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { data: user } = useUser();
  const { data: conversation } = useGetConversation(params.id);

  const participantName = (() => {
    if (!conversation || !user) return undefined;
    const other =
      conversation.participant_a.id === user.id
        ? conversation.participant_b
        : conversation.participant_a;
    return other.full_name?.trim() || other.email;
  })();

  return (
    <ChatWindow conversationId={params.id} participantName={participantName} />
  );
}
