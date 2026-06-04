import { render, screen } from '@testing-library/react';

import { Button } from '../button';

describe('Button', () => {
  test('rend un bouton avec son libellé', () => {
    render(<Button>Valider</Button>);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
  });

  test('iconPosition gère l’ordre icône / libellé', () => {
    const { rerender } = render(
      <Button icon={<svg data-testid="icon" />}>
        <span data-testid="label">L</span>
      </Button>,
    );
    let btn = screen.getByRole('button');
    // Défaut 'left' : icône avant le libellé.
    expect(btn.firstElementChild).toHaveAttribute('data-testid', 'icon');
    expect(btn.lastElementChild).toHaveAttribute('data-testid', 'label');

    rerender(
      <Button icon={<svg data-testid="icon" />} iconPosition="right">
        <span data-testid="label">L</span>
      </Button>,
    );
    btn = screen.getByRole('button');
    // 'right' : libellé avant l'icône.
    expect(btn.firstElementChild).toHaveAttribute('data-testid', 'label');
    expect(btn.lastElementChild).toHaveAttribute('data-testid', 'icon');
  });

  test('espacement par gap (plus de wrapper mx-2) + cible tactile mobile', () => {
    render(<Button icon={<svg data-testid="icon" />}>Label</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('gap-2');
    // Plus de <span className="mx-2"> autour des enfants.
    // eslint-disable-next-line testing-library/no-node-access
    expect(btn.querySelector('.mx-2')).toBeNull();
    // 44px en mobile, 36px à partir de md.
    expect(btn.className).toContain('h-11');
    expect(btn.className).toContain('md:h-9');
  });

  test('fullWidth ajoute w-full', () => {
    render(<Button fullWidth>X</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  test('isLoading désactive le bouton et expose aria-busy', () => {
    render(<Button isLoading>Envoi</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  test('asChild rend l’enfant en conservant les classes du bouton', () => {
    render(
      <Button asChild>
        <a href="/x">Lien</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Lien' });
    expect(link.className).toContain('bg-primary');
  });
});
