import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReadingView } from '../reading-view';

const defaultProps = {
  title: 'Première Lecture',
  reference: 'Is 55, 10-11',
  text: '<p>Comme la pluie et la neige descendent des cieux.</p>',
  isHtml: true,
  onBack: vi.fn(),
};

describe('ReadingView', () => {
  beforeEach(() => {
    defaultProps.onBack.mockReset();
  });

  test('renders title and reference', () => {
    render(<ReadingView {...defaultProps} />);

    expect(screen.getByText('Première Lecture')).toBeInTheDocument();
    expect(screen.getByText('Is 55, 10-11')).toBeInTheDocument();
  });

  test('renders sanitized HTML content when isHtml is true', () => {
    render(
      <ReadingView
        {...defaultProps}
        text="<p>Texte sain</p><script>alert('xss')</script>"
        isHtml={true}
      />,
    );

    expect(screen.getByText('Texte sain')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  test('renders plain text content when isHtml is false', () => {
    render(
      <ReadingView
        {...defaultProps}
        text="Texte en clair sans HTML."
        isHtml={false}
      />,
    );

    expect(screen.getByText('Texte en clair sans HTML.')).toBeInTheDocument();
  });

  test('shows initial font size of 16', () => {
    render(<ReadingView {...defaultProps} />);

    expect(screen.getByText('16')).toBeInTheDocument();
  });

  test('increases font size when + button is clicked', async () => {
    render(<ReadingView {...defaultProps} />);

    await userEvent.click(
      screen.getByRole('button', { name: /augmenter la taille du texte/i }),
    );

    expect(screen.getByText('18')).toBeInTheDocument();
  });

  test('decreases font size when - button is clicked', async () => {
    render(<ReadingView {...defaultProps} />);

    await userEvent.click(
      screen.getByRole('button', { name: /reduire la taille du texte/i }),
    );

    expect(screen.getByText('14')).toBeInTheDocument();
  });

  test('font size does not go below 12', async () => {
    render(<ReadingView {...defaultProps} />);

    const decreaseBtn = screen.getByRole('button', {
      name: /reduire la taille du texte/i,
    });

    // Click multiple times to try to go below 12
    await userEvent.click(decreaseBtn);
    await userEvent.click(decreaseBtn);
    await userEvent.click(decreaseBtn);
    await userEvent.click(decreaseBtn);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  test('font size does not exceed 24', async () => {
    render(<ReadingView {...defaultProps} />);

    const increaseBtn = screen.getByRole('button', {
      name: /augmenter la taille du texte/i,
    });

    // Click multiple times to try to exceed 24
    for (let i = 0; i < 10; i++) {
      await userEvent.click(increaseBtn);
    }

    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.queryByText('26')).not.toBeInTheDocument();
  });

  test('back button calls onBack', async () => {
    render(<ReadingView {...defaultProps} />);

    await userEvent.click(screen.getByRole('button', { name: /retour/i }));

    expect(defaultProps.onBack).toHaveBeenCalledOnce();
  });
});
