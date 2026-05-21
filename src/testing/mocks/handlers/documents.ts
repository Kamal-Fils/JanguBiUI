import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';

const mockDocuments = [
  createDocumentRequest({
    id: '1',
    status: 'submitted',
    document_type: 'Baptême',
  }),
  createDocumentRequest({
    id: '2',
    status: 'validated',
    document_type: 'Confirmation',
  }),
  createDocumentRequest({
    id: '3',
    status: 'info_requested',
    document_type: 'Mariage',
    notes: 'Veuillez fournir les actes de naissance.',
  }),
];

export const documentsHandlers = [
  http.get(`${env.API_URL}/v1/documents/requests/`, () => {
    return HttpResponse.json({
      count: mockDocuments.length,
      results: mockDocuments,
    });
  }),

  http.get(`${env.API_URL}/v1/documents/requests/:id/`, ({ params }) => {
    const doc = mockDocuments.find((d) => d.id === params.id);
    if (!doc) {
      return HttpResponse.json(
        { message: 'Document introuvable.' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      ...doc,
      status_logs: [
        {
          status: 'submitted',
          created_at: doc.created_at,
          note: null,
        },
      ],
    });
  }),

  http.post(`${env.API_URL}/v1/documents/requests/`, async ({ request }) => {
    const body = (await request.json()) as {
      document_type: string;
      notes?: string;
    };
    const created = createDocumentRequest({
      id: '99',
      document_type: body.document_type,
      notes: body.notes ?? null,
      status: 'submitted',
    });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.post(
    `${env.API_URL}/v1/documents/requests/:id/supplement/`,
    async ({ params, request }) => {
      const body = (await request.json()) as { notes: string };
      const doc = mockDocuments.find((d) => d.id === params.id);
      if (!doc) {
        return HttpResponse.json(
          { message: 'Document introuvable.' },
          { status: 404 },
        );
      }
      return HttpResponse.json({
        detail: 'Informations envoyées.',
        notes: body.notes,
      });
    },
  ),

  http.post(`${env.API_URL}/v1/files/upload/standard/`, () => {
    return HttpResponse.json({ id: 42 }, { status: 201 });
  }),
];
