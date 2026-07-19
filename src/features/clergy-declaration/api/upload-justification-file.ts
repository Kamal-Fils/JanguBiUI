import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type UploadJustificationResponse = { id: number };

/**
 * Téléverse la pièce justificative. Le backend ne considère un fichier valide
 * qu'une fois `upload_finished_at` posé : la déclaration ne peut donc être
 * soumise qu'APRÈS que cet appel a rendu un `id`.
 */
export const uploadJustificationFile = (
  file: File,
): Promise<UploadJustificationResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<UploadJustificationResponse>(
    '/v1/files/upload/standard/',
    formData,
  );
};

export const useUploadJustificationFile = () =>
  useMutation({ mutationFn: uploadJustificationFile });
