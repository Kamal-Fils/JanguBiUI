import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import {
  createLiturgyDay,
  createRosaryDay,
  createRosaryGroup,
} from '@/testing/data-generators';

const mockLiturgyDay = createLiturgyDay({
  date: new Date().toISOString().split('T')[0],
  season: 'Temps ordinaire',
  readings: [
    {
      id: 'reading-1',
      type: 'Première Lecture',
      citation: 'Is 55, 10-11',
      text: "<p>Comme la pluie et la neige descendent des cieux et n'y retournent pas sans avoir abreuvé la terre.</p>",
    },
    {
      id: 'reading-2',
      type: 'Psaume',
      citation: 'Ps 33',
      text: '<p>Goûtez et voyez comme est bon le Seigneur.</p>',
    },
    {
      id: 'reading-3',
      type: 'Évangile',
      citation: 'Mt 6, 7-15',
      text: '<p>Voici comment vous devez prier : Notre Père qui es aux cieux...</p>',
    },
  ],
});

const mockRosaryGroups = [
  createRosaryGroup({ id: 1, name: 'Joyeux' }),
  createRosaryGroup({ id: 2, name: 'Lumineux' }),
  createRosaryGroup({ id: 3, name: 'Douloureux' }),
  createRosaryGroup({ id: 4, name: 'Glorieux' }),
];

const mockRosaryToday = createRosaryDay({
  day: {
    id: 1,
    weekday_display: 'Lundi',
    group: mockRosaryGroups[0],
  },
});

export const bibleHandlers = [
  http.get(`${env.API_URL}/v1/liturgy/today/`, () => {
    return HttpResponse.json(mockLiturgyDay);
  }),

  http.get(`${env.API_URL}/v1/rosary/today/`, () => {
    return HttpResponse.json(mockRosaryToday);
  }),

  http.get(`${env.API_URL}/v1/rosary/groups/`, () => {
    return HttpResponse.json({ results: mockRosaryGroups });
  }),

  http.get(`${env.API_URL}/v1/bible/books/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        { id: 1, name: 'Genèse', slug: 'gn', testament: 1, chapters_count: 50 },
        { id: 2, name: 'Exode', slug: 'ex', testament: 1, chapters_count: 40 },
      ],
    });
  }),

  http.get(`${env.API_URL}/v1/bible/testaments/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        { id: 1, name: 'Ancien Testament' },
        { id: 2, name: 'Nouveau Testament' },
      ],
    });
  }),

  http.get(`${env.API_URL}/v1/bible/verses/`, () => {
    return HttpResponse.json({ count: 0, results: [] });
  }),

  http.get(`${env.API_URL}/v1/bible/search/`, () => {
    return HttpResponse.json({ results: [] });
  }),
];
