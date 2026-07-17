import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type UploadCoverImageResponse = { id: number };

/**
 * Upload de l'image de bannière d'un article via le module files.
 * (Uploader local à la feature news — pas d'import cross-feature.)
 */
export const uploadCoverImage = (
  file: File,
): Promise<UploadCoverImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<UploadCoverImageResponse>(
    '/v1/files/upload/standard/',
    formData,
  );
};

export const useUploadCoverImage = () =>
  useMutation({ mutationFn: uploadCoverImage });
