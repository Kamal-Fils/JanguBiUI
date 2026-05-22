import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { Conversation, conversationSchema } from '../types';

export const getConversation = (id: string): Promise<Conversation> =>
  api
    .get<unknown>(`/v1/messaging/conversations/${id}/`)
    .then((data) => conversationSchema.parse(data));

export const useGetConversation = (id: string) => {
  const { data: user } = useUser();
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => getConversation(id),
    enabled: !!id && !!user,
  });
};
