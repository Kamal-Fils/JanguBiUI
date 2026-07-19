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
  // Le backend nomme ce champ `reference` (unique, généré à la soumission) et
  // le renvoie DÈS la liste. Le schéma lisait `reference_number` — un champ
  // inexistant : `.optional()` masquait l'écart et la référence officielle
  // n'était jamais affichée nulle part.
  reference: z.string().nullable().optional(),
  document_type: z.string(),
  status: documentStatusSchema,
  notes: z.string().nullable().optional(),
  requester_name: z.string().optional(),
  parish_name: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  // Délais calculés par le serveur (apps/documents/sla.py) : l'ancienneté se
  // mesure depuis la dernière action et le seuil dépend du statut. Optionnels
  // pour tolérer un front déployé avant le backend — sans eux, l'UI n'affiche
  // aucune alerte plutôt que d'en inventer une.
  sla_days: z.number().nullable().optional(),
  sla_threshold_days: z.number().nullable().optional(),
  is_escalated: z.boolean().optional(),
  // Document final déposé, exposé dès la liste : évite au coffre-fort de
  // charger le détail de chaque certificat pour obtenir ce lien.
  final_document_url: z.string().nullable().optional(),
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
  rejection_reason: z.string().nullable().optional(),
  attachments: z.array(attachmentSchema).optional(),
  status_logs: z
    .array(
      z.object({
        to_status: documentStatusSchema,
        created_at: z.string(),
        comment: z.string().nullable().optional(),
        // Acteur réel de la transition (« Système » si automatique). Disponible
        // depuis toujours côté API ; l'affichage reste en rôle générique tant
        // que le client n'a pas tranché nom vs rôle (Q2 du plan).
        changed_by_name: z.string().nullable().optional(),
      }),
    )
    .optional(),
});

export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentRequest = z.infer<typeof documentRequestSchema>;
export type DocumentRequestDetail = z.infer<typeof documentRequestDetailSchema>;
