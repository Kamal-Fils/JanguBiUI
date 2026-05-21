'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, MailOpen } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { useClericalInbox } from '../api/get-clerical-inbox';
import type { ClergicalMessage } from '../api/get-clerical-inbox';

interface ClericalInboxListProps {
  onSelect: (message: ClergicalMessage) => void;
  selectedId?: number;
}

function MessageRow({
  message,
  isSelected,
  onClick,
}: {
  message: ClergicalMessage;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isRead = !!message.read_at;
  const date = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <button
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      } ${!isRead ? 'font-medium' : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">
          {isRead ? (
            <MailOpen className="h-4 w-4 text-gray-400" />
          ) : (
            <Mail className="h-4 w-4 text-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-sm truncate">{message.sender_email}</span>
            <span className="text-xs text-gray-400 flex-shrink-0">{date}</span>
          </div>
          <p className="text-sm text-gray-700 truncate">{message.subject}</p>
          <p className="text-xs text-gray-400 truncate">
            {message.body.slice(0, 80)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function ClericalInboxList({
  onSelect,
  selectedId,
}: ClericalInboxListProps) {
  const { data, isLoading, isError } = useClericalInbox();

  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="px-4 py-6 text-sm text-red-500 text-center">
        Erreur lors du chargement des messages.
      </p>
    );
  }

  const messages = data?.results ?? [];

  if (messages.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-500 text-center">
        Aucun message reçu.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {messages.map((msg) => (
        <MessageRow
          key={msg.id}
          message={msg}
          isSelected={msg.id === selectedId}
          onClick={() => onSelect(msg)}
        />
      ))}
    </div>
  );
}
