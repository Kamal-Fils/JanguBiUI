import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export type UploadDocumentFileResponse = { id: number };

export const uploadDocumentFile = (
  file: File,
): Promise<UploadDocumentFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<UploadDocumentFileResponse>(
    '/v1/files/upload/standard/',
    formData,
  );
};

export const useUploadDocumentFile = () =>
  useMutation({ mutationFn: uploadDocumentFile });
