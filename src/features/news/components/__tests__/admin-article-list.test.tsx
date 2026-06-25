import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createArticle, createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { AdminArticleList } from '../admin-article-list';

const ME = `${env.API_URL}/v1/auth/me/`;

function mockMe(role: 'church_admin' | 'parish_admin') {
  server.use(
    http.get(ME, () => HttpResponse.json(createUser({ role, is_admin: true }))),
  );
}

describe('AdminArticleList — publish/unpublish gating (UI matches API)', () => {
  test('church_admin (diacre) does NOT see the Publier button on a draft', async () => {
    mockMe('church_admin');
    const draft = createArticle({ title: 'Brouillon diacre', status: 'draft' });

    renderApp(<AdminArticleList articles={[draft]} />);

    // Le diacre garde l'accès au brouillon (Voir / Modifier) mais pas la publication.
    expect(await screen.findByTitle('Voir')).toBeInTheDocument();
    expect(screen.getByTitle('Modifier')).toBeInTheDocument();
    expect(screen.queryByTitle('Publier')).not.toBeInTheDocument();
  });

  test('church_admin (diacre) does NOT see the Dépublier button on a published article', async () => {
    mockMe('church_admin');
    const published = createArticle({
      title: 'Article publié',
      status: 'published',
    });

    renderApp(<AdminArticleList articles={[published]} />);

    expect(await screen.findByTitle('Voir')).toBeInTheDocument();
    expect(screen.queryByTitle('Dépublier')).not.toBeInTheDocument();
  });

  test('parish_admin sees the Publier button on a draft', async () => {
    mockMe('parish_admin');
    const draft = createArticle({ title: 'Brouillon paroisse', status: 'draft' });

    renderApp(<AdminArticleList articles={[draft]} />);

    expect(await screen.findByTitle('Publier')).toBeInTheDocument();
  });

  test('parish_admin sees the Dépublier button on a published article', async () => {
    mockMe('parish_admin');
    const published = createArticle({
      title: 'Article publié paroisse',
      status: 'published',
    });

    renderApp(<AdminArticleList articles={[published]} />);

    expect(await screen.findByTitle('Dépublier')).toBeInTheDocument();
  });
});
