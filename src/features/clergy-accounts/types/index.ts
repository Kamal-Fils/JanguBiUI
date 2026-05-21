import { z } from 'zod';

export const clergicalInvitationSchema = z.object({
  id: z.number(),
  token: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  pastoral_role: z.enum([
    'pretre',
    'diacre',
    'religieux',
    'eveque',
    'archeveque',
  ]),
  diocese_name: z.string().nullable().optional(),
  status: z.enum(['pending', 'accepted', 'revoked', 'expired']),
  status_label: z.string(),
  created_by_name: z.string().nullable().optional(),
  expires_at: z.string(),
  created_at: z.string(),
});

export type ClergicalInvitation = z.infer<typeof clergicalInvitationSchema>;

export type InvitationStatus = ClergicalInvitation['status'];
export type InvitablePastoralRole = ClergicalInvitation['pastoral_role'];
