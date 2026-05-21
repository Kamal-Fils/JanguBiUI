import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createRosaryGroup } from '@/testing/data-generators';

import { MysterySelector } from '../mystery-selector';

const mockGroups = [
  createRosaryGroup({
    id: 1,
    name: 'Joyeux',
    mysteries:
      "L'Annonciation\nLa Visitation\nLa Nativité\nLa Présentation\nLe Recouvrement",
  }),
  createRosaryGroup({
    id: 2,
    name: 'Lumineux',
    mysteries:
      "Le Baptême\nLes Noces\nL'Annonce\nLa Transfiguration\nL'Institution",
  }),
  createRosaryGroup({
    id: 3,
    name: 'Douloureux',
    mysteries:
      "L'Agonie\nLa Flagellation\nLe Couronnement\nLe Portement\nLa Crucifixion",
  }),
  createRosaryGroup({
    id: 4,
    name: 'Glorieux',
    mysteries:
      "La Résurrection\nL'Ascension\nLa Pentecôte\nL'Assomption\nLe Couronnement de Marie",
  }),
];

const onSelectGroup = vi.fn();
const onStartGuide = vi.fn();

const defaultProps = {
  todayGroup: mockGroups[0],
  groups: mockGroups,
  selectedGroup: mockGroups[0],
  onSelectGroup,
  onStartGuide,
};

describe('MysterySelector', () => {
  beforeEach(() => {
    onSelectGroup.mockReset();
    onStartGuide.mockReset();
  });

  test('renders all mystery group buttons', () => {
    render(<MysterySelector {...defaultProps} />);

    expect(screen.getByRole('button', { name: /joyeux/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /lumineux/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /douloureux/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /glorieux/i }),
    ).toBeInTheDocument();
  });

  test('shows "Mystères Joyeux" card when Joyeux group is selected', () => {
    render(<MysterySelector {...defaultProps} />);

    expect(screen.getByText(/mystères joyeux/i)).toBeInTheDocument();
  });

  test('calls onSelectGroup when a different group button is clicked', async () => {
    render(<MysterySelector {...defaultProps} />);

    await userEvent.click(screen.getByRole('button', { name: /lumineux/i }));

    expect(onSelectGroup).toHaveBeenCalledWith(mockGroups[1]);
  });

  test('calls onStartGuide when "Commencer le chapelet guidé" is clicked', async () => {
    render(<MysterySelector {...defaultProps} />);

    await userEvent.click(
      screen.getByRole('button', { name: /commencer le chapelet guidé/i }),
    );

    expect(onStartGuide).toHaveBeenCalledOnce();
  });

  test('shows "Aujourd\'hui" badge for the today group', () => {
    render(<MysterySelector {...defaultProps} />);

    expect(screen.getByText(/aujourd'hui/i)).toBeInTheDocument();
  });

  test('displays individual mysteries list when mysteries string is parseable', () => {
    render(<MysterySelector {...defaultProps} />);

    expect(screen.getByText("L'Annonciation")).toBeInTheDocument();
    expect(screen.getByText('La Visitation')).toBeInTheDocument();
    expect(screen.getByText('La Nativité')).toBeInTheDocument();
  });

  test('does not show audio player when audio file is empty', () => {
    const groupWithoutAudio = { ...mockGroups[0], audio_file: '' };
    render(
      <MysterySelector {...defaultProps} selectedGroup={groupWithoutAudio} />,
    );

    // AudioPlayer is not rendered when audio_file is empty
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/lecture/i)).not.toBeInTheDocument();
  });

  test('shows audio player when audio file is available', () => {
    const groupWithAudio = {
      ...mockGroups[0],
      audio_file: 'https://example.com/joyeux.mp3',
    };
    render(
      <MysterySelector {...defaultProps} selectedGroup={groupWithAudio} />,
    );

    // AudioPlayer renders a play button when audio is available
    expect(screen.getByRole('button', { name: /lecture/i })).toBeInTheDocument();
  });
});
