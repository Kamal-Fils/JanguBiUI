import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SuggestionChips } from '../suggestion-chips';

describe('SuggestionChips', () => {
  test('renders the four suggestion cards', () => {
    render(<SuggestionChips onSelect={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /évangile du jour/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /chapelet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /trouver un prêtre/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /prêtre en ligne/i }),
    ).toBeInTheDocument();
  });

  test('clicking a card sends the full suggestion text', async () => {
    const onSelect = vi.fn();
    render(<SuggestionChips onSelect={onSelect} />);

    await userEvent.click(
      screen.getByRole('button', { name: /évangile du jour/i }),
    );

    expect(onSelect).toHaveBeenCalledWith(
      'Quelles sont les lectures du jour ?',
    );
  });

  test('compact variant also sends the full suggestion text', async () => {
    const onSelect = vi.fn();
    render(<SuggestionChips onSelect={onSelect} compact />);

    await userEvent.click(
      screen.getByRole('button', { name: /trouver un prêtre/i }),
    );

    expect(onSelect).toHaveBeenCalledWith(
      'Je cherche un prêtre disponible près de Dakar',
    );
  });
});
