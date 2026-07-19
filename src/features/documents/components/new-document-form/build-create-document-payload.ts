import type { CreateDocumentInput } from '../../api/create-document';

import type { FormValues } from './schema';

/**
 * Traduction des valeurs du formulaire vers le corps attendu par l'API.
 *
 * Fonction pure, isolée du composant : c'est ici — et nulle part ailleurs — que
 * se décide ce qui part réellement au serveur. Le contrat front↔back de ce
 * projet a déjà dérivé par le passé (champ mal nommé, champ omis, panne
 * silencieuse en 200) ; le garder en un seul endroit nommé le rend relisible.
 */

/** Champs propres à certains types, regroupés dans `document_details`. */
function buildDocumentDetails(
  values: FormValues,
): Record<string, string> | undefined {
  if (values.document_type === 'religious_marriage') {
    return {
      spouse_full_name_groom: values.spouse_full_name_groom ?? '',
      spouse_full_name_bride: values.spouse_full_name_bride ?? '',
    };
  }
  if (values.document_type === 'godparent') {
    return {
      celebration_type: values.celebration_type ?? '',
    };
  }
  return undefined;
}

export function buildCreateDocumentPayload(
  values: FormValues,
): CreateDocumentInput {
  return {
    document_type: values.document_type,
    // Les précisions ne partent que si « Autre » est bien le choix retenu.
    document_type_free:
      values.document_type === 'other'
        ? values.document_type_free?.trim()
        : undefined,
    reason: values.reason,
    reason_free:
      values.reason === 'other' ? values.reason_free?.trim() : undefined,
    requester_last_name: values.requester_last_name,
    requester_first_names: values.requester_first_names,
    date_of_birth: values.date_of_birth,
    place_of_birth: values.place_of_birth,
    contact_phone: values.contact_phone,
    contact_email: values.contact_email,
    father_last_name: values.father_last_name,
    mother_last_name: values.mother_last_name,
    // Paroisse du registre : FK seule (B5c). Le back dérive nom + diocèse.
    parish_id: values.parish_id,
    sacrament_approximate_date: values.sacrament_approximate_date,
    sacrament_location: values.sacrament_location,
    additional_info: values.additional_info || undefined,
    document_details: buildDocumentDetails(values),
    attachment_file_id: values.attachment_file_id ?? null,
    consent_given: true,
  };
}
