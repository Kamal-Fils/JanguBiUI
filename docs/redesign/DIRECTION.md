# Direction de design — Jàngu Bi

> **À valider avant toute propagation.** Ce document dit ce que l'application
> doit être et pourquoi. Il est court exprès : tu dois pouvoir le lire en cinq
> minutes et répondre « oui, c'est ça » ou « non, pas ça ».
>
> Ce qui suit n'est pas décoratif. Chaque règle est opposable : on doit pouvoir
> regarder un écran et dire s'il la respecte.

---

## 0. Pourquoi ce document existe

La première refonte a déçu. La cause n'était pas des écrans laids, c'était
l'**absence d'intention déclarée** : chaque écran a été traité localement, sans
système, donc sans ambition cumulée. On a produit de l'hygiène — états vides,
messages d'erreur, tableaux cohérents — et pris ça pour du design.

Deux facteurs aggravants, désormais corrigés :

- l'**accent or ne s'affichait nulle part** (le token était déclaré en camelCase,
  la classe écrite en kebab-case n'était donc jamais générée). La seule
  signature visuelle de la direction était invisible à 43 endroits ;
- le **système de tokens était riche mais inutilisé** : échelle typographique
  allant jusqu'à 3,5 rem, rythme d'espacement, mesure de lecture, texture
  papier, courbes d'animation — et des écrans entièrement en `text-sm`, même
  rayon, même ombre, même carte.

---

## 1. Le parti pris

**Jàngu Bi est une application de lecture avant d'être une application de
gestion.** On l'ouvre pour l'Évangile du jour, un office, un acte de baptême —
pas pour consulter un tableau de bord. Le texte est donc le sujet, et la
typographie fait le gros du travail. Les cartes, les ombres et les icônes sont
au service du texte, jamais l'inverse.

La référence n'est pas un SaaS. C'est un **missel** : papier, filets, encre or,
hiérarchie claire entre la parole et l'appareil critique.

**Contre-exemple à bannir** : une grille de cartes uniformes, même rayon, même
ombre, même densité, où rien n'indique ce qui compte.

---

## 2. Les cinq règles

### R1 — Le contraste d'échelle porte la hiérarchie

Un écran doit avoir **un** sujet, et il doit se voir sans lire. On utilise
vraiment l'échelle disponible (`--text-display` jusqu'à 3,5 rem) pour ce qui
compte, et le petit corps pour l'appareil (surtitres, métadonnées, dates).

> Test : masque tout sauf les tailles de texte. Est-ce qu'on devine le sujet ?

### R2 — La couleur liturgique est une information, pas un ornement

Violet pour l'Avent et le Carême, blanc et or pour Noël et Pâques, rouge pour la
Pentecôte et les martyrs, vert pour le temps ordinaire. Elle se déduit du temps
liturgique renvoyé par l'AELF (`src/features/home/utils/liturgical-color.ts`) et
change donc toute seule au fil de l'année.

C'est un signe que **tout fidèle sait lire** — et qu'aucun template générique ne
possède. Elle habille les ouvertures d'écrans spirituels. Elle ne remplace
jamais un signal fonctionnel (un statut, une erreur) : la couleur seule ne porte
jamais une information critique (WCAG 1.4.1).

### R3 — La profondeur vient de la surface, pas de l'ombre

Texture papier (`.bg-paper`), filets or (`.hairline-gold`), superpositions et
changements de surface. Pas d'empilement d'ombres portées : un missel n'a pas
d'ombres, il a du grain et des filets.

### R4 — Mobile d'abord, pour de vrai

La cible est majoritairement sur téléphone, souvent modeste, parfois en plein
soleil. Donc : zoom **jamais bloqué**, cibles tactiles d'au moins 44 px,
contrastes tenus, pas de survol comme seule affordance, et une mise en page qui
respire sans exiger de la largeur.

### R5 — Trois archétypes, trois traitements

Toute l'application se ramène à trois familles. C'est ce qui permet de propager
sans re-décider à chaque écran.

| Archétype | Écrans | Traitement |
| --- | --- | --- |
| **Lecture** | liturgie du jour, Heures, Bible, chapelet, article, réflexion | Immersif. Mesure de lecture (~68ch), grande échelle, ornement minimal, couleur liturgique en ouverture, texture papier. |
| **Flux** | actualités, agenda, TV, coffre-fort | Éditorial. Hiérarchie une/secondaires, image porteuse, rythme irrégulier assumé — surtout pas une grille uniforme. |
| **Travail** | file paroissiale, admin, tableaux de bord | Dense et efficace. Zéro ornement, information par unité de surface maximale, action principale visible, jamais de décor qui ralentit. |

> Un écran qui ne sait pas à quelle famille il appartient est un écran mal conçu.

---

## 3. Comment on propage

**Par composants partagés, pas écran par écran.** La propagation doit consister à
assembler des blocs construits une fois. Re-styler chaque page à la main est
précisément ce qui a produit l'incohérence.

Conséquence pratique : on utilise les primitives **shadcn** existantes plutôt que
d'en réécrire des versions dégradées — notamment sa `sidebar` (rail, repli en
icônes avec info-bulles, tiroir mobile, raccourci clavier), aujourd'hui
réimplémentée à la main, et ses blocs de graphiques pour les tableaux de bord.

---

## 4. Les trois écrans de référence

À valider avant toute propagation. Un par archétype :

| Archétype | Écran de référence | État |
| --- | --- | --- |
| Lecture | Accueil du fidèle (`/app`) | ✅ livré — la Parole du jour en ouverture, couleur liturgique |
| Lecture (suite) | Liturgie du jour (`/app/spirituel/liturgie`) | à faire — c'est la page vers laquelle l'accueil envoie |
| Flux | Actualités (`/app/actus`) | partiellement — lecture d'article traitée, le fil reste à finir |
| Travail | File paroissiale (`/app/admin/documents`) | à faire |

**Si ces écrans sont validés, le reste est de l'application mécanique.**
S'ils ne le sont pas, on n'a perdu que trois écrans.

---

## 5. Ce qu'on ne fait pas

- Pas de refonte des 40 écrans avant validation des trois références.
- Pas de mode sombre par défaut : la direction est claire d'abord (ivoire), le
  sombre existe et doit rester soigné, mais il n'est pas le sujet.
- Pas de changement des tokens de couleur : le bleu (#1A8FCC clair / #70CBFF
  sombre) est un choix client, il est acquis.
- Pas d'ornement qui ralentit un écran de travail.

---

## 6. Comment tu juges

Sur le **staging**, pas sur une description. Pour chaque écran de référence,
trois questions :

1. Est-ce que je vois le sujet sans lire ?
2. Est-ce que ça ressemble à ce produit-là, ou à n'importe quelle app ?
3. Est-ce que je m'en servirais sur mon téléphone, dehors ?
