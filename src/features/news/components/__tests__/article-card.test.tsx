import { render, screen } from '@testing-library/react';

import {
  createArticle,
  createArticleCategory,
} from '@/testing/data-generators';

import { ArticleCard } from '../article-card';

// Mock next/image to avoid issues in test environment
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe('ArticleCard', () => {
  test('renders article title', () => {
    const article = createArticle({ title: 'Un titre très important' });
    render(<ArticleCard article={article} />);

    expect(screen.getByText('Un titre très important')).toBeInTheDocument();
  });

  test('renders views count', () => {
    const article = createArticle({ views_count: 142 });
    render(<ArticleCard article={article} />);

    expect(screen.getByText('142')).toBeInTheDocument();
  });

  test('link points to /app/actus/:id', () => {
    const article = createArticle({ id: 'article-abc' });
    render(<ArticleCard article={article} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/app/actus/article-abc');
  });

  test('renders category name when present', () => {
    const article = createArticle({
      category: createArticleCategory({ name: 'Spiritualité' }),
    });
    render(<ArticleCard article={article} />);

    expect(screen.getByText('Spiritualité')).toBeInTheDocument();
  });

  test('does not render category when not present', () => {
    const article = createArticle({ category: null });
    render(<ArticleCard article={article} />);

    expect(screen.queryByText('Spiritualité')).not.toBeInTheDocument();
  });

  test('renders published date when present', () => {
    const article = createArticle({
      published_at: '2024-01-15T00:00:00Z',
    });
    render(<ArticleCard article={article} />);

    // We look for a date-like string — it will be formatted in fr-FR locale
    expect(screen.getByText(/janv/i)).toBeInTheDocument();
  });

  test('renders cover image when cover_image_url is present', () => {
    const article = createArticle({
      cover_image_url: 'https://example.com/image.jpg',
      title: 'Article avec image',
    });
    render(<ArticleCard article={article} />);

    expect(
      screen.getByRole('img', { name: /article avec image/i }),
    ).toBeInTheDocument();
  });

  test('does not render image when cover_image_url is null', () => {
    const article = createArticle({ cover_image_url: null });
    render(<ArticleCard article={article} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('shows scope label "Universel" for global scope', () => {
    const article = createArticle({ scope_type: 'global' });
    render(<ArticleCard article={article} />);

    expect(screen.getByText('Universel')).toBeInTheDocument();
  });

  test('renders without crash when all optional fields are null', () => {
    const article = createArticle({
      title: 'Article minimaliste',
      cover_image_url: null,
      category: null,
      excerpt: null,
      published_at: null,
    });
    render(<ArticleCard article={article} />);

    expect(screen.getByText('Article minimaliste')).toBeInTheDocument();
  });
});
