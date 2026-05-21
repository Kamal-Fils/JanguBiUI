import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import {
  createArticle,
  createArticleDetail,
  createArticleCategory,
} from '@/testing/data-generators';

const mockCategory = createArticleCategory({
  name: 'Spiritualité',
  slug: 'spiritualite',
});

const mockGlobalArticles = [
  createArticle({
    id: 'article-1',
    title: 'Le pape François appelle à la prière pour la paix',
    scope_type: 'global',
    category: mockCategory,
    author_name: 'Rédaction Vatican',
    views_count: 142,
  }),
  createArticle({
    id: 'article-2',
    title: 'Retraite spirituelle au sanctuaire de Popenguine',
    scope_type: 'global',
    author_name: 'Père Augustin',
    views_count: 87,
  }),
];

const mockParishArticles = [
  createArticle({
    id: 'article-p1',
    title: 'Réunion du conseil paroissial ce samedi',
    scope_type: 'parish',
    author_name: 'Secrétariat',
    views_count: 23,
  }),
];

const mockArticleDetails: Record<
  string,
  ReturnType<typeof createArticleDetail>
> = {
  'article-1': createArticleDetail({
    id: 'article-1',
    title: 'Le pape François appelle à la prière pour la paix',
    content:
      '<p>Le Saint-Père a lancé un appel solennel à la communauté internationale.</p>',
    scope_type: 'global',
    category: mockCategory,
    author_name: 'Rédaction Vatican',
    views_count: 142,
  }),
  'article-2': createArticleDetail({
    id: 'article-2',
    title: 'Retraite spirituelle au sanctuaire de Popenguine',
    content:
      '<p>Une retraite de trois jours est organisée pour les jeunes chrétiens.</p>',
    scope_type: 'global',
    author_name: 'Père Augustin',
    views_count: 87,
  }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function requireAuth(request: Request): HttpResponse<any> | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return HttpResponse.json(
      { detail: 'Authentication credentials were not provided.' },
      { status: 401 },
    );
  }
  return null;
}

export const newsHandlers = [
  http.get(`${env.API_URL}/v1/news/`, () => {
    return HttpResponse.json({
      count: mockGlobalArticles.length,
      results: mockGlobalArticles,
    });
  }),

  http.get(`${env.API_URL}/v1/news/my-parish/`, ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;
    return HttpResponse.json({
      count: mockParishArticles.length,
      results: mockParishArticles,
    });
  }),

  http.get(`${env.API_URL}/v1/news/:id/`, ({ params }) => {
    const id = String(params.id);
    const article = mockArticleDetails[id];
    if (!article) {
      return HttpResponse.json(
        { message: 'Article introuvable.' },
        { status: 404 },
      );
    }
    return HttpResponse.json(article);
  }),
];
