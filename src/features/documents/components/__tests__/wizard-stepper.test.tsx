import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WizardStepper } from '../wizard-stepper';

const STEPS = ['Document', 'Paroisse', 'Détails', 'Validation'];

describe('WizardStepper', () => {
  test('expose une liste ordonnée d’étapes nommées dans une navigation', () => {
    render(<WizardStepper steps={STEPS} current={0} />);

    // Sémantique : navigation + liste d'étapes (pas un progressbar, les étapes
    // franchies étant des contrôles interactifs).
    expect(
      screen.getByRole('navigation', { name: /progression de la demande/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('annonce la position, le libellé et l’état de chaque étape', () => {
    render(<WizardStepper steps={STEPS} current={1} />);

    expect(
      screen.getByText('Étape 1 sur 4 : Document, terminée'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Étape 2 sur 4 : Paroisse, en cours'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Étape 3 sur 4 : Détails, à venir'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Étape 4 sur 4 : Validation, à venir'),
    ).toBeInTheDocument();
  });

  test('marque l’étape courante avec aria-current="step"', () => {
    const { container } = render(<WizardStepper steps={STEPS} current={2} />);

    const currents = container.querySelectorAll('[aria-current="step"]');
    expect(currents).toHaveLength(1);
    expect(currents[0]).toHaveTextContent('Détails');
  });

  test('seules les étapes franchies sont cliquables (jamais en avant)', () => {
    render(<WizardStepper steps={STEPS} current={2} onStepSelect={() => {}} />);

    // Étapes 1 et 2 franchies → boutons ; étapes 3 (courante) et 4 → non.
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(
      screen.getByRole('button', {
        name: "Revenir à l'étape 1 sur 4 : Document",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: "Revenir à l'étape 2 sur 4 : Paroisse",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Validation/ }),
    ).not.toBeInTheDocument();
  });

  test('un clic sur une étape franchie remonte son index', async () => {
    const onStepSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <WizardStepper steps={STEPS} current={3} onStepSelect={onStepSelect} />,
    );

    await user.click(
      screen.getByRole('button', {
        name: "Revenir à l'étape 2 sur 4 : Paroisse",
      }),
    );

    expect(onStepSelect).toHaveBeenCalledWith(1);
  });

  test('sans onStepSelect, aucune étape n’est cliquable', () => {
    render(<WizardStepper steps={STEPS} current={3} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
