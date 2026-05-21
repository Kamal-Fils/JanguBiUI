import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { createMinister, createParish } from '@/testing/data-generators';

const mockMinisters = [
  createMinister({
    id: 'minister-1',
    slug: 'abbe-jean',
    name: 'Abbé Jean Dupont',
    title: 'Prêtre',
    parish: 'Paroisse Saint-Pierre',
  }),
  createMinister({
    id: 'minister-2',
    slug: 'abbe-paul',
    name: 'Abbé Paul Martin',
    title: 'Vicaire',
    parish: 'Paroisse Sainte-Marie',
  }),
];

const mockParishes = [
  createParish({ id: 1, name: 'Paroisse Saint-Pierre', slug: 'saint-pierre' }),
  createParish({ id: 2, name: 'Paroisse Sainte-Marie', slug: 'sainte-marie' }),
];

const mockServices = [
  { id: 1, name: 'Célébration de mariage', slug: 'mariage' },
  { id: 2, name: 'Baptême', slug: 'bapteme' },
  { id: 3, name: 'Funérailles', slug: 'funerailles' },
];

export const alloPretreHandlers = [
  http.get(`${env.API_URL}/v1/availability/ministers/`, () => {
    return HttpResponse.json({
      count: mockMinisters.length,
      results: mockMinisters,
    });
  }),

  http.get(`${env.API_URL}/v1/availability/parishes/`, () => {
    return HttpResponse.json({ results: mockParishes });
  }),

  http.get(`${env.API_URL}/v1/availability/services/`, () => {
    return HttpResponse.json({ results: mockServices });
  }),

  http.get(`${env.API_URL}/v1/availability/available/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),
];
