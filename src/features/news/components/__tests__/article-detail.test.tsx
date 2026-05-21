import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { createArticleDetail } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ArticleDetail } from '../article-detail';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockRouterBack = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  back: mockRouterBack,
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as never);

describe('ArticleDetail', () => {
  beforeEach(() => {
    mockRouterBack.mockReset();
  });

  test('shows loading skeleton while fetching article', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/article-1/`, async () => {
        await delay(Infinity);
        return HttpResponse.json(
          createArticleDetail({ id: 'article-1', title: 'Test' }),
        );
      }),
    );

    renderApp(<ArticleDetail articleId="article-1" />);

    // eslint-disable-next-line testing-library/no-node-access
    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  test('shows article title after loading', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/article-1/`, () =>
        HttpResponse.json(
          createArticleDetail({
            id: 'article-1',
            title: 'Le pape François appelle à la paix',
          }),
        ),
      ),
    );

    renderApp(<ArticleDetail articleId="article-1" />);

    // Title appears in h1 (and also in the sticky header) — query the h1 specifically
    expect(
      await screen.findByRole('heading', {
        name: 'Le pape François appelle à la paix',
      }),
    ).toBeInTheDocument();
  });

  test('shows author name', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/article-1/`, () =>
        HttpResponse.json(
          createArticleDetail({
            id: 'article-1',
            author_name: 'Père Bernard',
          }),
        ),
      ),
    );

    renderApp(<ArticleDetail articleId="article-1" />);

    expect(await screen.findByText('Père Bernard')).toBeInTheDocument();
  });

  test('shows views count', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/article-1/`, () =>
        HttpResponse.json(
          createArticleDetail({
            id: 'article-1',
            views_count: 250,
          }),
        ),
      ),
    );

    renderApp(<ArticleDetail articleId="article-1" />);

    expect(await screen.findByText(/250/i)).toBeInTheDocument();
  });

  test('renders HTML content sanitized (no script injection)', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/article-1/`, () =>
        HttpResponse.json(
          createArticleDetail({
            id: 'article-1',
            content: '<p>Texte sain.</p><script>alert("xss")</script>',
          }),
        ),
      ),
    );

    renderApp(<ArticleDetail articleId="article-1" />);

    await screen.findByText('Texte sain.');
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelector('script')).toBeNull();
  });

  test('shows "Article introuvable" when article is not found', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/nonexistent/`, () =>
        HttpResponse.json({ message: 'Article introuvable.' }, { status: 404 }),
      ),
    );

    renderApp(<ArticleDetail articleId="nonexistent" />);

    expect(await screen.findByText('Article introuvable.')).toBeInTheDocument();
  });

  test('back button in error state calls router.back()', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/nonexistent/`, () =>
        HttpResponse.json({ message: 'Not found.' }, { status: 404 }),
      ),
    );

    renderApp(<ArticleDetail articleId="nonexistent" />);

    const backBtn = await screen.findByRole('button', { name: /retour/i });
    await userEvent.click(backBtn);

    expect(mockRouterBack).toHaveBeenCalledOnce();
  });

  test('back button in header calls router.back()', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/article-1/`, () =>
        HttpResponse.json(
          createArticleDetail({ id: 'article-1', title: 'Mon Article' }),
        ),
      ),
    );

    renderApp(<ArticleDetail articleId="article-1" />);

    // Wait for the article heading to load
    await screen.findByRole('heading', { name: 'Mon Article' });

    const backBtn = screen.getByRole('button', { name: /retour/i });
    await userEvent.click(backBtn);

    expect(mockRouterBack).toHaveBeenCalledOnce();
  });

  test('renders without crash when optional fields are null', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/article-1/`, () =>
        HttpResponse.json(
          createArticleDetail({
            id: 'article-1',
            title: 'Article sans optionnels',
            cover_image_url: null,
            category: null,
            published_at: null,
          }),
        ),
      ),
    );

    renderApp(<ArticleDetail articleId="article-1" />);

    await screen.findByRole('heading', { name: 'Article sans optionnels' });
  });
});
