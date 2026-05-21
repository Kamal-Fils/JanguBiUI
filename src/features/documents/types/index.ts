import { z } from 'zod';

export const documentStatusSchema = z.enum([
  'submitted',
  'under_verification',
  'validated',
  'document_deposited',
  'info_requested',
  'rejected',
]);

export const documentRequestSchema = z.object({
  id: z.string(),
  document_type: z.string(),
  status: documentStatusSchema,
  notes: z.string().nullable().optional(),
  requester_name: z.string().optional(),
  parish_name: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

const attachmentSchema = z.object({
  id: z.number(),
  attachment_type: z.string(),
  attachment_type_label: z.string().optional(),
  label: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  created_at: z.string(),
});

export type DocumentAttachment = z.infer<typeof attachmentSchema>;

export const documentRequestDetailSchema = documentRequestSchema.extend({
  reference_number: z.string().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  attachments: z.array(attachmentSchema).optional(),
  status_logs: z
    .array(
      z.object({
        to_status: documentStatusSchema,
        created_at: z.string(),
        comment: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentRequest = z.infer<typeof documentRequestSchema>;
export type DocumentRequestDetail = z.infer<typeof documentRequestDetailSchema>;
