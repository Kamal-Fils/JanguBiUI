'use client';

import { Bell } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown/dropdown';
import {
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/use-notifications';
import type { Notification } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

const EVENT_LABELS: Record<string, string> = {
  new_message: 'Nouveau message reçu',
  'conversation.purge_upcoming': 'Conversation bientôt supprimée',
  document_status_changed: 'Statut de document mis à jour',
  document_info_requested: 'Informations demandées sur un document',
  document_validated: 'Document validé',
  document_rejected: 'Document rejeté',
  document_deposited: 'Document déposé',
};

function formatEventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

function formatRelativeTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  return (
    <DropdownMenuItem
      onClick={() => {
        if (!notification.is_read) {
          onRead(notification.id);
        }
      }}
      className={cn(
        'flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer',
        !notification.is_read && 'bg-primary/5',
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground leading-tight">
          {formatEventLabel(notification.event_type)}
        </span>
        {!notification.is_read && (
          <span className="size-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
      <span suppressHydrationWarning className="text-xs text-muted-foreground">
        {formatRelativeTime(notification.created_at)}
      </span>
    </DropdownMenuItem>
  );
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { data: notifications = [] } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Notifications'
          }
          className={cn(
            'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted/70 lg:justify-start justify-center',
            className,
          )}
        >
          <span className="relative shrink-0">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span className="hidden lg:block">Notifications</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={markRead}
            />
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
