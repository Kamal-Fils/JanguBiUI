import { MessageCircle } from 'lucide-react';

import { ConversationList } from '@/features/messaging/components/conversation-list';

export default function MessagesPage() {
  return (
    <>
      {/* Mobile: full conversation list */}
      <div className="md:hidden">
        <ConversationList />
      </div>
      {/* Desktop: placeholder in right panel (left panel is in layout) */}
      <div className="hidden md:flex md:flex-1 md:flex-col md:items-center md:justify-center md:gap-3 md:text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <MessageCircle className="size-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">
          Sélectionnez une conversation
        </p>
      </div>
    </>
  );
}
