import { z } from 'zod';

export const transferStatusSchema = z.enum([
  'pending',
  'approved_by_origin',
  'acknowledged_by_destination',
  'completed',
  'rejected',
]);

export const transferRequestSchema = z.object({
  id: z.number(),
  status: transferStatusSchema,
  reason: z.string().optional().nullable(),
  rejection_reason: z.string().optional().nullable(),
  origin_parish_name: z.string().optional().nullable(),
  destination_parish_name: z.string().optional().nullable(),
  created_at: z.string(),
  updated_at: z.string().optional().nullable(),
});

export type TransferStatus = z.infer<typeof transferStatusSchema>;
export type TransferRequest = z.infer<typeof transferRequestSchema>;
