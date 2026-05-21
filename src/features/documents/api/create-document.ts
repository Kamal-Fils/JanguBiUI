import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { DocumentRequest, documentRequestSchema } from '../types';

export type CreateDocumentInput = {
  document_type: string;
  reason: string;
  reason_free?: string;
  // Identité
  requester_last_name: string;
  requester_first_names: string;
  date_of_birth: string;
  place_of_birth: string;
  // Contact
  contact_phone: string;
  contact_email: string;
  // Recherche
  registered_last_name?: string;
  registered_first_names?: string;
  father_last_name: string;
  mother_last_name: string;
  parish_name: string;
  diocese: string;
  sacrament_approximate_date: string;
  sacrament_location: string;
  additional_info?: string;
  document_details?: Record<string, string>;
  consent_given: boolean;
  attachment_file_id?: number | null;
};

export const createDocumentRequest = (
  data: CreateDocumentInput,
): Promise<DocumentRequest> =>
  api
    .post<unknown>('/v1/documents/requests/', data)
    .then((res) => documentRequestSchema.parse(res));

export const useCreateDocument = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocumentRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'requests'] });
      onSuccess?.();
    },
  });
};
