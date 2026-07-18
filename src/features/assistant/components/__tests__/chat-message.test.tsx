import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatMessage, type AppMessage } from '../chat-message';

const baseUser: AppMessage = {
  id: 'u1',
  role: 'user',
  content: 'Qui est Marie ?',
};

const baseAssistant: AppMessage = {
  id: 'a1',
  role: 'assistant',
  content: 'Marie est la mère de Jésus.',
};

describe('ChatMessage', () => {
  test('renders a user message with its content', () => {
    render(<ChatMessage message={baseUser} />);

    expect(screen.getByText('Qui est Marie ?')).toBeInTheDocument();
  });

  test('renders an assistant message with its content', () => {
    render(<ChatMessage message={baseAssistant} />);

    expect(screen.getByText('Marie est la mère de Jésus.')).toBeInTheDocument();
  });

  test('shows the Bible intent badge on assistant messages routed to bible', () => {
    render(
      <ChatMessage
        message={{ ...baseAssistant, intent: { module: 'bible' } }}
      />,
    );

    expect(screen.getByText('Bible')).toBeInTheDocument();
  });

  test('renders extractive verse blocks as scripture quotes with reference', () => {
    const content = [
      'Voici les passages les plus pertinents trouvés dans nos textes de référence :',
      '',
      '=== PASSAGES BIBLIQUES ===',
      'Livre: Jean 3:16',
      'Texte: Car Dieu a tant aimé le monde.',
    ].join('\n');

    const { container } = render(
      <ChatMessage message={{ ...baseAssistant, content }} />,
    );

    // Le passage est mis en forme en citation scripturaire (blockquote).
    expect(container.querySelector('blockquote')).not.toBeNull();
    expect(screen.getByText('Jean 3:16')).toBeInTheDocument();
    expect(
      screen.getByText('Car Dieu a tant aimé le monde.'),
    ).toBeInTheDocument();
    // Le texte d'introduction reste rendu en texte courant.
    expect(
      screen.getByText(/passages les plus pertinents/i),
    ).toBeInTheDocument();
  });

  test('renders bold segments of the answer', () => {
    render(
      <ChatMessage
        message={{ ...baseAssistant, content: 'Un mot **important** ici.' }}
      />,
    );

    const strong = screen.getByText('important');
    expect(strong.tagName).toBe('STRONG');
  });

  test('shows a retry action on error messages and calls onRetry when clicked', async () => {
    const onRetry = vi.fn();
    render(
      <ChatMessage
        message={{
          id: 'e1',
          role: 'assistant',
          content: "Je n'ai pas pu générer de réponse pour le moment.",
          isError: true,
        }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
