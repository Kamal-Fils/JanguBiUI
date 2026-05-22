import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { createMinister, createParish } from '@/testing/data-generators';

const mockMinisters = [
  createMinister({
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    role: 'PRIEST',
    role_display: 'Prêtre',
    parish: { id: 1, name: 'Paroisse Saint-Pierre', slug: 'saint-pierre', city: 'Dakar' },
    parish_id: 1,
    is_active: true,
  }),
  createMinister({
    id: 2,
    first_name: 'Marie',
    last_name: 'Ndiaye',
    role: 'SISTER',
    role_display: 'Sœur',
    parish: { id: 2, name: 'Paroisse Sainte-Marie', slug: 'sainte-marie', city: 'Thiès' },
    parish_id: 2,
    is_active: true,
  }),
  createMinister({
    id: 3,
    first_name: 'Paul',
    last_name: 'Fall',
    role: 'DEACON',
    role_display: 'Diacre',
    parish: { id: 1, name: 'Paroisse Saint-Pierre', slug: 'saint-pierre', city: 'Dakar' },
    parish_id: 1,
    is_active: true,
  }),
];

const mockParishes = [
  createParish({ id: 1, name: 'Paroisse Saint-Pierre', slug: 'saint-pierre', city: 'Dakar' }),
  createParish({ id: 2, name: 'Paroisse Sainte-Marie', slug: 'sainte-marie', city: 'Thiès' }),
];

const mockServices = [
  { id: 1, name: 'Célébration de mariage', slug: 'mariage' },
  { id: 2, name: 'Baptême', slug: 'bapteme' },
  { id: 3, name: 'Funérailles', slug: 'funerailles' },
];

export const alloPretreHandlers = [
  http.get(`${env.API_URL}/v1/availability/ministers/`, () =>
    HttpResponse.json({ count: mockMinisters.length, results: mockMinisters }),
  ),

  http.get(`${env.API_URL}/v1/availability/parishes/`, () =>
    HttpResponse.json({ results: mockParishes }),
  ),

  http.get(`${env.API_URL}/v1/availability/services/`, () =>
    HttpResponse.json({ results: mockServices }),
  ),

  http.get(`${env.API_URL}/v1/availability/available/`, () =>
    HttpResponse.json({ count: 0, results: [] }),
  ),
];
