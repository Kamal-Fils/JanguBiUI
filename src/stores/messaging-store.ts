import { create } from 'zustand';

type MessagingStore = {
  totalUnread: number;
  setTotalUnread: (count: number) => void;
};

export const useMessagingStore = create<MessagingStore>((set) => ({
  totalUnread: 0,
  setTotalUnread: (count) => set({ totalUnread: count }),
}));
