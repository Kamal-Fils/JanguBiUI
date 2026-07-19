import { z } from 'zod';

/**
 * Contrat de validation du formulaire de demande de document.
 *
 * Le schéma et la règle « Autre ⇒ précision obligatoire » vivent ensemble parce
 * qu'ils décrivent la même chose : ce qu'une demande doit contenir pour être
 * recevable. Le backend applique les mêmes règles (`apps/documents/services.py`) ;
 * ce fichier en est le reflet côté client, pas la source de vérité.
 */

/**
 * Règle « Autre ⇒ précision obligatoire », définie UNE fois.
 *
 * Elle est appliquée à deux endroits parce qu'un seul ne suffit pas : le
 * `superRefine` du schéma ne s'exécute pas tant que l'objet de base est invalide
 * (à l'étape 1, `parish_id` n'est pas encore saisi — zod court-circuite les
 * raffinements). L'étape 1 vérifie donc la règle explicitement, et le schéma la
 * garde pour la soumission finale. Le backend l'applique de son côté.
 */
export type PrecisionField = 'document_type_free' | 'reason_free';

export function precisionIssues(values: {
  document_type?: string;
  document_type_free?: string;
  reason?: string;
  reason_free?: string;
}): { path: PrecisionField; message: string }[] {
  const issues: { path: PrecisionField; message: string }[] = [];
  if (values.document_type === 'other' && !values.document_type_free?.trim()) {
    issues.push({
      path: 'document_type_free',
      message: 'Veuillez préciser le document demandé',
    });
  }
  if (values.reason === 'other' && !values.reason_free?.trim()) {
    issues.push({
      path: 'reason_free',
      message: 'Veuillez préciser le motif',
    });
  }
  return issues;
}

export const schema = z
  .object({
    document_type: z
      .string()
      .min(1, 'Veuillez sélectionner un type de document'),
    document_type_free: z.string().optional(),
    reason: z.string().min(1, 'Veuillez sélectionner un motif'),
    reason_free: z.string().optional(),
    requester_first_names: z.string().min(1, 'Prénom(s) requis'),
    requester_last_name: z.string().min(1, 'Nom requis'),
    date_of_birth: z.string().min(1, 'Date de naissance requise'),
    place_of_birth: z.string().min(1, 'Lieu de naissance requis'),
    father_last_name: z.string().min(1, 'Nom du père requis'),
    mother_last_name: z.string().min(1, 'Nom de la mère requis'),
    // Paroisse du registre choisie via le picker (FK). parish_name/diocese sont
    // dérivés de la paroisse sélectionnée et envoyés au back (validation).
    parish_id: z
      .number({
        required_error: 'Paroisse requise',
        invalid_type_error: 'Paroisse requise',
      })
      .int()
      .positive('Paroisse requise'),
    sacrament_approximate_date: z.string().min(1, 'Date approximative requise'),
    sacrament_location: z.string().min(1, 'Lieu du sacrement requis'),
    additional_info: z.string().optional(),
    contact_phone: z.string().min(1, 'Téléphone requis'),
    contact_email: z.string().email('Email invalide'),
    attachment_file_id: z.number().nullable().optional(),
    consent_given: z.boolean().refine((v) => v === true, {
      message: 'Vous devez accepter les conditions.',
    }),
    // Champs conditionnels selon le type de document
    spouse_full_name_groom: z.string().optional(),
    spouse_full_name_bride: z.string().optional(),
    celebration_type: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // « Autre » sans précision = une demande que la paroisse ne peut pas traiter.
    // Le backend applique la même règle (apps/documents/services.py).
    for (const issue of precisionIssues(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: [issue.path],
      });
    }
    if (data.document_type === 'religious_marriage') {
      if (!data.spouse_full_name_groom?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nom complet de l'époux requis",
          path: ['spouse_full_name_groom'],
        });
      }
      if (!data.spouse_full_name_bride?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nom complet de l'épouse requis",
          path: ['spouse_full_name_bride'],
        });
      }
    }
    if (data.document_type === 'godparent') {
      if (!data.celebration_type?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Type de célébration requis',
          path: ['celebration_type'],
        });
      }
    }
  });

export type FormValues = z.infer<typeof schema>;
