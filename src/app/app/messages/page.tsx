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
      <div className="bg-paper hidden md:flex md:flex-1 md:flex-col md:items-center md:justify-center md:gap-4 md:px-8 md:text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle
            className="size-8 text-primary"
            aria-hidden="true"
          />
        </div>
        <div>
          <p className="font-serif text-lg font-semibold text-foreground">
            Vos conversations
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Sélectionnez une conversation pour reprendre l&apos;échange, en
            toute confidentialité.
          </p>
        </div>
        <div className="hairline-gold w-24" aria-hidden="true" />
      </div>
    </>
  );
}
