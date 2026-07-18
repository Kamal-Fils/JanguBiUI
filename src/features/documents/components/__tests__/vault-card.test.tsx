import { screen } from '@testing-library/react';

import { createDocumentRequest } from '@/testing/data-generators';
import { renderApp } from '@/testing/test-utils';

import { VaultCard } from '../vault-card';

const deposited = (overrides = {}) =>
  createDocumentRequest({
    id: '42',
    reference: 'DOC-2026-0188',
    document_type: 'confirmation',
    status: 'document_deposited',
    requester_name: 'Awa Sène',
    parish_name: 'Cathédrale du Souvenir Africain',
    updated_at: '2026-05-03T09:00:00Z',
    ...overrides,
  });

describe('VaultCard', () => {
  test('carte-certificat : référence officielle, destinataire, paroisse et date de dépôt', () => {
    renderApp(<VaultCard document={deposited()} />);

    expect(screen.getByText('Attestation de confirmation')).toBeInTheDocument();
    expect(screen.getByText(/Réf\. DOC-2026-0188/)).toBeInTheDocument();
    expect(screen.getByText(/Délivrée à/, { selector: 'p' })).toHaveTextContent(
      'Awa Sène',
    );
    expect(
      screen.getByText('Cathédrale du Souvenir Africain'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Déposée le 3 mai 2026/)).toBeInTheDocument();
  });

  test('accord en genre : « Délivré » pour un certificat, « Délivrée » pour une attestation', () => {
    const { unmount } = renderApp(
      <VaultCard document={deposited({ document_type: 'baptism' })} />,
    );

    expect(
      screen.getByText(/Délivré à/, { selector: 'p' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Déposé le 3 mai 2026/)).toBeInTheDocument();
    unmount();

    renderApp(<VaultCard document={deposited()} />);
    expect(
      screen.getByText(/Délivrée à/, { selector: 'p' }),
    ).toBeInTheDocument();
  });

  test('téléchargement en 1 clic quand l’URL du fichier est résolue', () => {
    renderApp(
      <VaultCard
        document={deposited()}
        downloadUrl="https://files.test/confirmation.pdf"
      />,
    );

    const download = screen.getByRole('link', { name: /télécharger/i });
    expect(download).toHaveAttribute(
      'href',
      'https://files.test/confirmation.pdf',
    );
    expect(download).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('sans URL résolue : aucun bouton de téléchargement mort, le détail reste accessible', () => {
    renderApp(<VaultCard document={deposited()} />);

    expect(
      screen.queryByRole('link', { name: /télécharger/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /voir la démarche/i }),
    ).toHaveAttribute('href', '/app/documents/42');
  });

  test('le partage est présent mais désactivé et annoncé « Bientôt »', () => {
    renderApp(<VaultCard document={deposited()} />);

    const share = screen.getByRole('button', { name: /partager/i });
    expect(share).toBeDisabled();
    expect(share).toHaveAttribute('aria-disabled', 'true');
    expect(share).toHaveTextContent(/bientôt/i);
  });

  test('sans référence renvoyée par l’API, la pastille disparaît sans casser la carte', () => {
    renderApp(<VaultCard document={deposited({ reference: null })} />);

    expect(screen.queryByText(/Réf\./)).not.toBeInTheDocument();
    expect(screen.getByText('Attestation de confirmation')).toBeInTheDocument();
  });
});
