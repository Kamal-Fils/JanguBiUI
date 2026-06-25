'use client';

import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { AudioPlayer } from '@/components/ui/audio-player/audio-player';
import { Button } from '@/components/ui/button/button';
import { Card, CardContent } from '@/components/ui/card/card';
import { Progress } from '@/components/ui/progress/progress';
import { ScriptureQuote } from '@/components/ui/scripture-quote';
import type { RosaryGroup } from '@/features/chapelet/api/get-rosary-groups';
import type { TodayRosary } from '@/features/chapelet/api/get-rosary-today';

type MysteryCategory = 'joyeux' | 'douloureux' | 'glorieux' | 'lumineux';

interface ChapeletGuideProps {
  group: RosaryGroup;
  todayRosary: TodayRosary;
  onBack: () => void;
}

const mysteryNames: Record<MysteryCategory, string[]> = {
  joyeux: [
    "L'Annonciation",
    'La Visitation',
    'La Nativite',
    'La Presentation au Temple',
    'Le Recouvrement de Jésus au Temple',
  ],
  douloureux: [
    "L'Agonie au Jardin des Oliviers",
    'La Flagellation',
    "Le Couronnement d'épines",
    'Le Portement de la Croix',
    'La Crucifixion',
  ],
  glorieux: [
    'La Resurrection',
    "L'Ascension",
    'La Pentecôte',
    "L'Assomption de Marie",
    'Le Couronnement de Marie',
  ],
  lumineux: [
    'Le Bapteme de Jésus',
    'Les Noces de Cana',
    "L'Annonce du Royaume",
    'La Transfiguration',
    "L'Institution de l'Eucharistie",
  ],
};

const meditations: Record<MysteryCategory, string[]> = {
  joyeux: [
    'L\'ange Gabriel est envoyé par Dieu à une jeune fille nommée Marie. "Réjouis-toi, comblée de grâce, le Seigneur est avec toi." Marie répond : "Voici la servante du Seigneur ; que tout m\'advienne selon ta parole."',
    "Marie se rend en hâte chez sa cousine Elisabeth. À son arrivée, l'enfant tressaille dans le sein d'Elisabeth qui s'écrie : \"Tu es bénie entre toutes les femmes, et le fruit de ton sein est béni.\"",
    "Jésus naît à Bethléem, dans une étable. Marie l'enveloppe de langes et le couche dans une crèche. Les bergers, avertis par les anges, viennent l'adorer.",
    'Quarante jours après la naissance de Jésus, Marie et Joseph le présentent au Temple. Le vieillard Siméon le prend dans ses bras et dit : "Mes yeux ont vu ton salut."',
    'Après trois jours de recherche angoissée, Marie et Joseph retrouvent Jésus au Temple, assis au milieu des docteurs. "Ne saviez-vous pas qu\'il me faut être chez mon Père ?"',
  ],
  douloureux: [
    'Au jardin de Gethsémani, Jésus prie avec angoisse : "Père, si tu veux, éloigne de moi cette coupe ; cependant, que ce ne soit pas ma volonté, mais la tienne qui se fasse."',
    'Jésus est attaché à une colonne et flagellé cruellement. Son corps est couvert de plaies.',
    'Les soldats tressent une couronne d\'épines et la placent sur la tête de Jésus. Ils se moquent de lui : "Salut, roi des Juifs !"',
    'Jésus porte sa croix vers le Calvaire. Il tombe sous le poids, mais se relève et continue son chemin pour notre salut.',
    'Jésus est cloué sur la croix. Après trois heures d\'agonie, il dit : "Père, entre tes mains je remets mon esprit." Et il expire.',
  ],
  glorieux: [
    'Au matin du troisième jour, le tombeau est vide. L\'ange annonce : "Il n\'est pas ici, il est ressuscité." Jésus vainc la mort et apparaît à ses disciples.',
    'Quarante jours après la Résurrection, Jésus s\'élève vers le ciel en présence de ses disciples. "Je suis avec vous tous les jours, jusqu\'à la fin du monde."',
    "Le jour de la Pentecôte, l'Esprit Saint descend sur les Apôtres sous forme de langues de feu. Remplis de force, ils commencent à proclamer l'Evangile.",
    "Au terme de sa vie terrestre, Marie est élevée corps et âme dans la gloire du ciel. Les anges l'accompagnent dans cette montée glorieuse.",
    'Marie est couronnée Reine du ciel et de la terre. Elle intercède pour nous auprès de son Fils dans la gloire éternelle.',
  ],
  lumineux: [
    'Jésus descend dans les eaux du Jourdain. Le ciel s\'ouvre, l\'Esprit descend comme une colombe et une voix dit : "Celui-ci est mon Fils bien-aimé, en qui je trouve ma joie."',
    'Aux noces de Cana, Marie dit aux serviteurs : "Faites tout ce qu\'il vous dira." Jésus change l\'eau en vin, manifestant sa gloire pour la première fois.',
    'Jésus parcourt la Galilée en proclamant : "Le Royaume de Dieu est tout proche. Convertissez-vous et croyez à l\'Évangile."',
    'Sur la montagne, Jésus est transfiguré. Son visage resplendit comme le soleil et ses vêtements deviennent blancs comme la lumière.',
    'Au cours du dernier repas, Jésus prend le pain et dit : "Ceci est mon corps, livré pour vous." Puis le vin : "Ceci est mon sang, versé pour la multitude."',
  ],
};

const guideSteps = [
  "Prières d'ouverture",
  'Annonce du mystère',
  'Méditation',
  'Dizaine (10 Je vous salue Marie)',
  'Gloire au Père',
];

const SIGN_OF_THE_CROSS =
  'Au nom du Père, et du Fils, et du Saint-Esprit. Amen.';
const FALLBACK_CREED =
  'Je crois en Dieu, le Père tout-puissant, Créateur du ciel et de la terre...';
const FALLBACK_HAIL_MARY =
  'Je vous salue Marie, pleine de grâce, le Seigneur est avec vous...';
const FALLBACK_GLORY_BE =
  'Gloire au Père, et au Fils, et au Saint-Esprit. Comme il était au commencement, maintenant et toujours, pour les siècles des siècles. Amen.';

export function ChapeletGuide({
  group,
  todayRosary,
  onBack,
}: ChapeletGuideProps) {
  const [currentMystery, setCurrentMystery] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Map backend slug to local category ('mysteres-joyeux' -> 'joyeux')
  const slugTarget = group.slug.split('-').pop();
  const category: MysteryCategory = (
    Object.keys(mysteryNames).includes(slugTarget as string)
      ? slugTarget
      : 'joyeux'
  ) as MysteryCategory;

  const totalSteps = 5 * guideSteps.length;
  const globalStep = currentMystery * guideSteps.length + currentStep;
  const progress = ((globalStep + 1) / totalSteps) * 100;

  const goNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentMystery < 4) {
      setCurrentMystery(currentMystery + 1);
      setCurrentStep(0);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentMystery > 0) {
      setCurrentMystery(currentMystery - 1);
      setCurrentStep(guideSteps.length - 1);
    }
  };

  const isFirst = currentMystery === 0 && currentStep === 0;
  const isLast = currentMystery === 4 && currentStep === guideSteps.length - 1;

  // Find standalone prayers from API
  const creedPrayer = todayRosary.standalone_prayers.find(
    (p) => p.type === 'CREED',
  );
  const hailMaryPrayer = todayRosary.standalone_prayers.find(
    (p) => p.type === 'HAIL_MARY',
  );
  const gloryBePrayer = todayRosary.standalone_prayers.find(
    (p) => p.type === 'GLORY_BE',
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Button
        variant="ghost-indigo"
        size="sm"
        onClick={onBack}
        className="w-fit"
        icon={<ArrowLeft className="size-4" />}
      >
        Retour
      </Button>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Mystère {currentMystery + 1}/5 - Étape {currentStep + 1}/
            {guideSteps.length}
          </span>
          <span className="font-medium text-gold-ink">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Mystery title & Audio Player */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
            {currentMystery + 1}e mystère
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {mysteryNames[category][currentMystery]}
          </h2>
          <div className="hairline-gold mx-auto mt-3 w-24" aria-hidden="true" />
        </div>

        {group.audio_file && (
          <AudioPlayer
            src={group.audio_file}
            title="Chapelet audio complet"
            className="w-full max-w-sm"
          />
        )}
      </div>

      {/* Step content */}
      <Card variant="sacred" className="gap-0 py-0">
        <CardContent className="p-6">
          <p className="mb-5 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
            <span className="flex size-6 items-center justify-center rounded-full bg-gold/15 font-serif text-xs text-gold-ink ring-1 ring-gold/25">
              {currentStep + 1}
            </span>
            {guideSteps[currentStep]}
          </p>

          {currentStep === 0 && (
            <div className="flex flex-col gap-4">
              <p className="font-serif text-lg font-medium text-foreground">
                {SIGN_OF_THE_CROSS}
              </p>
              <ScriptureQuote
                eyebrow="Symbole des Apôtres"
                text={creedPrayer ? creedPrayer.text : FALLBACK_CREED}
                size="sm"
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="flex flex-col gap-3">
              <p className="font-serif text-xl font-semibold text-foreground">
                {mysteryNames[category][currentMystery]}
              </p>
              <p className="border-l-[3px] border-gold pl-4 text-sm italic leading-relaxed text-muted-foreground">
                Fruit du mystère : la contemplation de cet événement de la vie
                du Christ et de Marie.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <ScriptureQuote
              eyebrow="Méditation"
              text={meditations[category][currentMystery]}
              size="sm"
            />
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center gap-6 py-2">
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex size-8 items-center justify-center rounded-full bg-gold/12 font-serif text-xs font-medium text-gold-ink shadow-soft-sm ring-1 ring-gold/20"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="mx-auto max-w-sm whitespace-pre-line text-center font-serif text-sm italic leading-relaxed text-foreground/85">
                {hailMaryPrayer ? hailMaryPrayer.text : FALLBACK_HAIL_MARY}
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <ScriptureQuote
              eyebrow="Doxologie"
              text={gloryBePrayer ? gloryBePrayer.text : FALLBACK_GLORY_BE}
              size="sm"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-2 flex items-center justify-between">
        <Button
          variant="outline-gold"
          size="lg"
          onClick={goPrev}
          disabled={isFirst}
          icon={<ChevronLeft className="size-4" />}
        >
          Précédent
        </Button>
        {isLast ? (
          <Button variant="gold" size="lg" onClick={onBack} className="px-8">
            Terminer
          </Button>
        ) : (
          <Button variant="gold" size="lg" onClick={goNext} className="px-6">
            <span className="flex items-center gap-2">
              Suivant
              <ChevronRight className="size-4" />
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
