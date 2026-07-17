import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

/**
 * Les actions par ligne vivent dans un menu « ⋯ » — on l'ouvre avant d'asserter.
 * La DataTable rend chaque ligne deux fois (table desktop + carte mobile,
 * départagées par CSS que jsdom n'applique pas) : on ouvre le premier menu.
 */
async function openRowActions(articleTitle: string) {
  const [trigger] = await screen.findAllByRole('button', {
    name: `Actions pour ${articleTitle}`,
  });
  await userEvent.click(trigger);
}

describe('AdminArticleList — publish/unpublish gating (UI matches API)', () => {
  test('church_admin (diacre) does NOT see the Publier action on a draft', async () => {
    mockMe('church_admin');
    const draft = createArticle({ title: 'Brouillon diacre', status: 'draft' });

    renderApp(<AdminArticleList articles={[draft]} />);

    await openRowActions(draft.title);

    // Le diacre garde l'accès au brouillon (Voir / Modifier) mais pas la publication.
    expect(
      await screen.findByRole('menuitem', { name: 'Voir' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Modifier' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Publier' }),
    ).not.toBeInTheDocument();
  });

  test('church_admin (diacre) does NOT see the Dépublier action on a published article', async () => {
    mockMe('church_admin');
    const published = createArticle({
      title: 'Article publié',
      status: 'published',
    });

    renderApp(<AdminArticleList articles={[published]} />);

    await openRowActions(published.title);

    expect(
      await screen.findByRole('menuitem', { name: 'Voir' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Dépublier' }),
    ).not.toBeInTheDocument();
  });

  test('parish_admin sees the Publier action on a draft', async () => {
    mockMe('parish_admin');
    const draft = createArticle({
      title: 'Brouillon paroisse',
      status: 'draft',
    });

    renderApp(<AdminArticleList articles={[draft]} />);

    await openRowActions(draft.title);

    expect(
      await screen.findByRole('menuitem', { name: 'Publier' }),
    ).toBeInTheDocument();
  });

  test('parish_admin sees the Dépublier action on a published article', async () => {
    mockMe('parish_admin');
    const published = createArticle({
      title: 'Article publié paroisse',
      status: 'published',
    });

    renderApp(<AdminArticleList articles={[published]} />);

    await openRowActions(published.title);

    expect(
      await screen.findByRole('menuitem', { name: 'Dépublier' }),
    ).toBeInTheDocument();
  });
});
