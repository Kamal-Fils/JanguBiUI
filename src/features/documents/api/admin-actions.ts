import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

const invalidateDocuments = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: ['documents'] });
};

export const useStartVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) =>
      api.post<void>(
        `/v1/documents/admin/requests/${requestId}/start-verification/`,
        {},
      ),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useRequestInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Le serveur attend `comment`. Le client envoyait `message` : DRF ignorait
    // le champ inconnu et retombait sur la valeur par défaut vide — la demande
    // partait donc en 200 avec un email et un journal SANS motif, alors que
    // l'agent croyait l'avoir écrit.
    mutationFn: ({
      requestId,
      message,
    }: {
      requestId: string;
      message: string;
    }) =>
      api.post<void>(
        `/v1/documents/admin/requests/${requestId}/request-info/`,
        { comment: message },
      ),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useValidateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // La validation ne porte pas de commentaire : l'endpoint ne lit aucun
    // corps de requête. On n'envoie donc rien plutôt qu'un champ silencieusement
    // jeté, qui laissait croire à une note conservée.
    mutationFn: ({ requestId }: { requestId: string }) =>
      api.post<void>(
        `/v1/documents/admin/requests/${requestId}/validate/`,
        {},
      ),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useRejectDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) =>
      api.post<void>(`/v1/documents/admin/requests/${requestId}/reject/`, {
        reason,
      }),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};

export const useDepositDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Déposer = joindre le document signé. `file_id` est OBLIGATOIRE côté
    // serveur ; le client envoyait `notes`, donc l'action terminale du workflow
    // échouait systématiquement en 400 et aucune demande n'atteignait jamais le
    // coffre-fort du fidèle.
    mutationFn: ({
      requestId,
      fileId,
      label,
    }: {
      requestId: string;
      fileId: number;
      label?: string;
    }) =>
      api.post<void>(`/v1/documents/admin/requests/${requestId}/deposit/`, {
        file_id: fileId,
        ...(label ? { label } : {}),
      }),
    onSuccess: () => invalidateDocuments(queryClient),
  });
};
