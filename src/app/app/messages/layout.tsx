import { ConversationList } from '@/features/messaging/components/conversation-list';

// Le shell (AppShell) est fourni par `app/app/layout.tsx`. Ce layout n'ajoute que
// la structure deux colonnes propre à la messagerie.
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex md:h-[calc(100dvh-0px)]">
      {/* Left column: conversation list — desktop only, sticky full height */}
      <div className="hidden md:flex md:w-80 md:shrink-0 md:flex-col md:overflow-y-auto md:border-r md:border-border">
        <ConversationList />
      </div>
      {/* Right column — full width on mobile, flex-1 on desktop */}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
