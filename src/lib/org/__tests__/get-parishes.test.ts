import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';

import { getParishes } from '../get-parishes';

const URL_PARISHES = `${env.API_URL}/v1/org/parishes/`;

const parish = (id: number, name: string) => ({
  id,
  name,
  city: '',
  address: '',
  diocese: 1,
  diocese_name: 'Diocèse',
});

describe('getParishes — pagination', () => {
  test('charge TOUTES les pages quand le diocèse dépasse une page', async () => {
    // count=2 mais 1 résultat par page → force une 2e requête (offset incrémenté).
    server.use(
      http.get(URL_PARISHES, ({ request }) => {
        const offset = Number(
          new URL(request.url).searchParams.get('offset') ?? '0',
        );
        return HttpResponse.json(
          offset === 0
            ? { count: 2, results: [parish(1, 'Paroisse 1')] }
            : { count: 2, results: [parish(2, 'Paroisse 2')] },
        );
      }),
    );

    const parishes = await getParishes({ dioceseId: 1 });

    // Les DEUX pages sont agrégées (pas de troncature à la page 1).
    expect(parishes.map((p) => p.id)).toEqual([1, 2]);
  });

  test('une seule requête quand tout tient sur une page (pas de boucle infinie)', async () => {
    let calls = 0;
    server.use(
      http.get(URL_PARISHES, () => {
        calls += 1;
        return HttpResponse.json({ count: 1, results: [parish(9, 'Unique')] });
      }),
    );

    const parishes = await getParishes({ dioceseId: 1 });

    expect(parishes.map((p) => p.id)).toEqual([9]);
    expect(calls).toBe(1);
  });
});
