// Re-export from the shared hook so feature-level code can import from here
export type { Notification } from '@/hooks/use-notifications';
export {
  getNotifications,
  useNotifications,
  useMarkNotificationRead,
} from '@/hooks/use-notifications';
