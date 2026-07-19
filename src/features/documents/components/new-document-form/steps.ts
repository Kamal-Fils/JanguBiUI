import type { FormValues } from './schema';

// ── Étapes : 6 micro-étapes → 4 étapes nommées (D3) ──────────────────────────
//
// Correspondance avec l'ancien découpage :
//   type                        → document
//   (paroisse extraite de search) → parish
//   identity + search + contact + attachments → details (sous-sections)
//   consent                     → review
// Aucun champ ajouté ni retiré : le payload `CreateDocumentInput` est inchangé.

export type Step = 'document' | 'parish' | 'details' | 'review';

export const STEPS: Step[] = ['document', 'parish', 'details', 'review'];

export const STEP_LABELS: Record<Step, string> = {
  document: 'Document',
  parish: 'Paroisse',
  details: 'Détails',
  review: 'Validation',
};

export const STEP_TITLES: Record<Step, string> = {
  document: 'Quel document ?',
  parish: 'Quelle paroisse ?',
  details: 'Vos informations',
  review: 'Récapitulatif',
};

export const STEP_HINTS: Record<Step, string> = {
  document: 'Choisissez le document souhaité, puis le motif de la demande.',
  parish:
    'La paroisse qui détient le registre de votre sacrement. Le diocèse est déduit automatiquement.',
  details:
    'Ces éléments permettent de retrouver votre acte dans les registres paroissiaux.',
  review: 'Vérifiez chaque section, puis confirmez pour envoyer votre demande.',
};

/** Champs validés avant d'autoriser le passage à l'étape suivante. */
export const STEP_FIELDS: Record<Step, (keyof FormValues)[]> = {
  document: ['document_type', 'document_type_free', 'reason', 'reason_free'],
  parish: ['parish_id'],
  details: [
    'requester_first_names',
    'requester_last_name',
    'date_of_birth',
    'place_of_birth',
    'father_last_name',
    'mother_last_name',
    'sacrament_approximate_date',
    'sacrament_location',
    'spouse_full_name_groom',
    'spouse_full_name_bride',
    'celebration_type',
    'contact_phone',
    'contact_email',
  ],
  review: ['consent_given'],
};

export const STEP_LABEL_LIST = STEPS.map((s) => STEP_LABELS[s]);
