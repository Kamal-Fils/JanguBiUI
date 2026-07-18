import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { VaultTeaserCard } from '../vault-teaser-card';

describe('VaultTeaserCard', () => {
  test('offers a permanent entry point to the vault', () => {
    render(<VaultTeaserCard count={1} onOpen={() => {}} />);

    expect(screen.getByText('Coffre-fort numérique')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /coffre-fort numérique/i }),
    ).toBeInTheDocument();
  });

  test('counts the delivered documents, singular and plural', () => {
    const { rerender } = render(
      <VaultTeaserCard count={1} onOpen={() => {}} />,
    );
    expect(
      screen.getByText('1 document délivré, conservé à vie et téléchargeable.'),
    ).toBeInTheDocument();

    rerender(<VaultTeaserCard count={3} onOpen={() => {}} />);
    expect(
      screen.getByText(
        '3 documents délivrés, conservés à vie et téléchargeables.',
      ),
    ).toBeInTheDocument();
  });

  test('stays inviting when no document has been delivered yet', () => {
    render(<VaultTeaserCard count={0} onOpen={() => {}} />);

    expect(
      screen.getByText(/conservés à vie et téléchargeables/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^0 document/)).not.toBeInTheDocument();
  });

  test('opens the vault when clicked', async () => {
    const onOpen = vi.fn();
    render(<VaultTeaserCard onOpen={onOpen} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onOpen).toHaveBeenCalledOnce();
  });
});
