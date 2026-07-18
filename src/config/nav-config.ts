import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Calendar,
  Church,
  Cross,
  FileText,
  Heart,
  Home,
  MessageCircle,
  Newspaper,
  ShieldCheck,
  User,
} from 'lucide-react';

import { paths } from '@/config/paths';
import { User as UserType } from '@/lib/auth';
import {
  canManageUsers,
  isAdmin,
  isClergy,
  isSuperAdmin,
} from '@/lib/authorization';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  clergyOnly?: boolean;
}

const ITEM_ACCUEIL: NavItem = { label: 'Accueil', href: '/app', icon: Home };
const ITEM_ACTUS: NavItem = {
  label: 'Actualité',
  href: '/app/actus',
  icon: Newspaper,
};
const ITEM_SPIRITUEL: NavItem = {
  label: 'Spiritualité',
  href: '/app/spirituel',
  icon: BookOpen,
};
const ITEM_DOCUMENTS: NavItem = {
  label: 'Documents',
  href: '/app/documents',
  icon: FileText,
};
const ITEM_AGENDA: NavItem = {
  label: 'Agenda',
  href: '/app/agenda',
  icon: Calendar,
};
const ITEM_TRANSFERT: NavItem = {
  label: 'Transfert',
  href: '/app/transfert',
  icon: ArrowLeftRight,
};
const ITEM_MESSAGES: NavItem = {
  label: 'Messages',
  href: '/app/messages',
  icon: MessageCircle,
};
const ITEM_PROFIL: NavItem = {
  label: 'Profil',
  href: '/app/profil',
  icon: User,
};
const ITEM_DONS: NavItem = {
  label: 'Dons',
  href: '/app/dons',
  icon: Heart,
};
const ITEM_CLERGE: NavItem = {
  label: 'Clergé',
  href: '/app/clerge',
  icon: Church,
  clergyOnly: true,
};
// Tableau de bord analytique (dons + fidèles) scopé au périmètre du responsable.
// Affiché pour tout le clergé ; la page gère le 403 (clergé sans périmètre) par un
// état vide — le back est la source de vérité de l'autorité territoriale.
const ITEM_ANALYTIQUE: NavItem = {
  label: 'Analytique',
  href: '/app/clerge/analytique',
  icon: BarChart3,
  clergyOnly: true,
};
// Admin "home" points directly to /app/admin to avoid the /app → /app/admin redirect flash
const ITEM_ACCUEIL_ADMIN: NavItem = {
  label: 'Accueil',
  href: '/app/admin',
  icon: Home,
  adminOnly: true,
};
// Passerelle vers les outils admin pour un membre du clergé qui est AUSSI
// administrateur digital (ex. curé = pretre + parish_admin). Sa home reste
// pastorale (cf. home-router) ; cette entrée lui donne accès à l'admin sans
// quitter sa nav clergé. Libellé distinct de l'« Accueil » admin.
const ITEM_ADMIN: NavItem = {
  label: 'Administration',
  href: '/app/admin',
  icon: ShieldCheck,
  adminOnly: true,
};

export const buildNavItems = (user: UserType | null | undefined): NavItem[] => {
  // Les deux dimensions (role admin / pastoral_role) sont INDÉPENDANTES : un curé
  // peut être à la fois parish_admin et pretre. Le guard `!isClergy` est donc
  // porteur (pas « défensif ») — il aiguille un tel utilisateur vers la nav
  // clergé (home pastorale), tandis qu'il accède à l'admin via ITEM_ADMIN.
  if (isAdmin(user) && !isClergy(user)) {
    return [
      ITEM_ACCUEIL_ADMIN,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  if (isClergy(user)) {
    return [
      ITEM_ACCUEIL,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_CLERGE,
      ITEM_ANALYTIQUE,
      // Clergé qui est aussi admin digital → passerelle vers l'admin.
      ...(isAdmin(user) ? [ITEM_ADMIN] : []),
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  // Fidèle
  return [
    ITEM_ACCUEIL,
    ITEM_ACTUS,
    ITEM_SPIRITUEL,
    ITEM_DOCUMENTS,
    ITEM_DONS,
    ITEM_AGENDA,
    ITEM_TRANSFERT,
    ITEM_MESSAGES,
    ITEM_PROFIL,
  ];
};

/**
 * Logique d'activation d'un lien de nav (partagée par la sidebar et la
 * bottom-nav). Accueil/Admin = exact, le reste = préfixe.
 */
export const isNavActive = (pathname: string, href: string): boolean => {
  if (href === '/app' || href === '/app/admin') return pathname === href;
  return pathname.startsWith(href);
};

/**
 * Bottom-nav mobile : ≤ 4 onglets primaires par rôle. Le 5e emplacement visible
 * est le bouton « Plus » rendu par `BottomNav` à partir de
 * `buildOverflowNavItems` (tous les items sidebar absents de la bottom-nav).
 * On garde donc ici un set resserré et role-aware.
 */
export const buildBottomNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  // Admin pur — Accueil, Actus, Messages, Profil (+ « Plus »)
  if (isAdmin(user) && !isClergy(user)) {
    return [ITEM_ACCUEIL_ADMIN, ITEM_ACTUS, ITEM_MESSAGES, ITEM_PROFIL];
  }

  // Clergé — Accueil, Spiritualité, Actus, Clergé (+ « Plus »)
  if (isClergy(user)) {
    return [ITEM_ACCUEIL, ITEM_SPIRITUEL, ITEM_ACTUS, ITEM_CLERGE];
  }

  // Fidèle — Accueil, Spiritualité, Actus, Messages (+ « Plus »)
  return [ITEM_ACCUEIL, ITEM_SPIRITUEL, ITEM_ACTUS, ITEM_MESSAGES];
};

/**
 * Items présents dans la sidebar mais PAS dans la bottom-nav → exposés via une
 * entrée « Plus » sur mobile pour éviter les routes orphelines.
 * Fidèle : Documents, Dons, Agenda, Transfert, Profil.
 * Clergé : Messages, Profil (+ ses items spécifiques).
 * Admin  : Spiritualité (+ tout item sidebar hors bottom-nav).
 */
export const buildOverflowNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  const bottomHrefs = new Set(buildBottomNavItems(user).map((i) => i.href));
  return buildNavItems(user).filter((i) => !bottomHrefs.has(i.href));
};

// ---------------------------------------------------------------------------
// Refonte V4-1 — sidebar « header + barre latérale + main + footer ».
// Les sections ci-dessous portent la navigation ET les sous-navigations de la
// barre latérale desktop (AppSidebar) et du tiroir mobile (BottomNav → Sheet).
// Les builders historiques (buildNavItems / buildBottomNavItems /
// buildOverflowNavItems) restent la source de la bottom-nav mobile.
// ---------------------------------------------------------------------------

/** Sous-navigation d'une section de la barre latérale. */
export interface NavSubItem {
  label: string;
  href: string;
  clergyOnly?: boolean;
}

/**
 * Section de la barre latérale : feuille (`href`) OU dépliable (`items`).
 * `activeRoot` couvre les hubs de section sans item propre (/app/spirituel,
 * /app/clerge, /app/actus) pour l'auto-dépliage et l'état actif.
 */
export interface NavSection {
  label: string;
  icon: React.ElementType;
  href?: string;
  items?: NavSubItem[];
  activeRoot?: string;
  adminOnly?: boolean;
  clergyOnly?: boolean;
}

// Filtre par type de contenu du fil Actus. Valeurs VÉRIFIÉES sur le contrat
// backend consommé par la feature news : `ContentType` de
// src/features/news/types = 'announcement' | 'article' | 'pastoral_letter'
// (envoyé au serveur comme `content_type`). On ne peut pas importer le type ici
// (config ne doit jamais importer depuis features — flux unidirectionnel).
const ACTUS_TYPE_PARAM = 'type';

// Vues internes de la page Bible (retours testeurs n°2 : plus de barre
// d'onglets, la sidebar pilote les vues via `?tab=`). Valeurs VÉRIFIÉES sur
// `VALID_TABS` de src/features/bible/components/bible-content.tsx :
// 'bible' (défaut) | 'lectio' | 'parcours'. Même contrainte d'import que pour
// ACTUS_TYPE_PARAM (flux unidirectionnel config ↛ features).
const BIBLE_TAB_PARAM = 'tab';

/** Query params discriminants pour l'activation des sous-navs. */
const SUBNAV_PARAMS = [ACTUS_TYPE_PARAM, BIBLE_TAB_PARAM] as const;

/**
 * Sections de la sidebar, filtrées par rôle (même RBAC que buildNavItems :
 * adminOnly → isAdmin, clergyOnly → isClergy ; « Utilisateurs » / « JanguBi
 * TV » / « Structure » reprennent les guards du hub /app/admin).
 */
export const buildNavSections = (
  user: UserType | null | undefined,
): NavSection[] => {
  const actusHref = paths.app.actus.getHref();

  const sections: NavSection[] = [
    {
      label: 'Accueil',
      icon: Home,
      // Admin pur : sa home EST /app/admin (même logique que
      // ITEM_ACCUEIL_ADMIN — évite le flash de redirection /app → /app/admin).
      href:
        isAdmin(user) && !isClergy(user)
          ? paths.app.admin.root.getHref()
          : paths.app.root.getHref(),
    },
    {
      label: 'Spiritualité',
      icon: BookOpen,
      activeRoot: paths.app.spirituel.getHref(),
      items: [
        { label: 'Bible', href: paths.app.bible.getHref() },
        // Vues internes de la page Bible (?tab=…) — cf. BIBLE_TAB_PARAM.
        {
          label: 'Lectio divina',
          href: `${paths.app.bible.getHref()}?${BIBLE_TAB_PARAM}=lectio`,
        },
        {
          label: 'Parcours de lecture',
          href: `${paths.app.bible.getHref()}?${BIBLE_TAB_PARAM}=parcours`,
        },
        {
          label: 'Liturgie du jour',
          href: paths.app.spirituelLiturgie.getHref(),
        },
        {
          label: 'Liturgie des heures',
          href: paths.app.spirituelHeures.getHref(),
          clergyOnly: true,
        },
        { label: 'Chapelet', href: paths.app.chapelet.getHref() },
        { label: 'TV catholique', href: paths.app.tv.getHref() },
        { label: 'Assistant spirituel', href: paths.app.assistant.getHref() },
      ],
    },
    {
      label: 'Actualité',
      icon: Newspaper,
      activeRoot: actusHref,
      items: [
        { label: 'Tout', href: actusHref },
        { label: 'Articles', href: `${actusHref}?${ACTUS_TYPE_PARAM}=article` },
        {
          label: 'Annonces',
          href: `${actusHref}?${ACTUS_TYPE_PARAM}=announcement`,
        },
        {
          label: 'Lettres pastorales',
          href: `${actusHref}?${ACTUS_TYPE_PARAM}=pastoral_letter`,
        },
      ],
    },
    {
      label: 'Messages',
      icon: MessageCircle,
      href: paths.app.messages.getHref(),
    },
    { label: 'Documents', icon: FileText, href: paths.app.documents.getHref() },
    { label: 'Agenda', icon: Calendar, href: paths.app.agenda.getHref() },
    { label: 'Intentions', icon: Cross, href: paths.app.intentions.getHref() },
    { label: 'Dons & Quêtes', icon: Heart, href: paths.app.dons.getHref() },
    {
      label: 'Transfert',
      icon: ArrowLeftRight,
      href: paths.app.transfert.getHref(),
    },
    {
      label: 'Espace clergé',
      icon: Church,
      clergyOnly: true,
      activeRoot: paths.app.clerge.root.getHref(),
      // Libellés alignés sur le hub /app/clerge (CLERGE_SECTIONS).
      items: [
        {
          label: 'Intentions de messe',
          href: paths.app.clerge.intentions.getHref(),
        },
        {
          label: 'Messagerie inter-clergé',
          href: paths.app.clerge.messages.getHref(),
        },
        {
          label: 'Transferts paroissiaux',
          href: paths.app.clerge.transferts.getHref(),
        },
        { label: 'Analytique', href: paths.app.clerge.analytique.getHref() },
      ],
    },
    {
      label: 'Administration',
      icon: ShieldCheck,
      adminOnly: true,
      items: [
        { label: 'Articles', href: paths.app.admin.articles.getHref() },
        { label: 'Documents', href: paths.app.admin.documents.getHref() },
        { label: 'Agenda', href: paths.app.admin.agenda.getHref() },
        // Guards identiques au hub /app/admin (AdminDashboardPage).
        ...(canManageUsers(user)
          ? [
              {
                label: 'Utilisateurs',
                href: paths.app.admin.users.list.getHref(),
              },
            ]
          : []),
        ...(isSuperAdmin(user)
          ? [
              { label: 'JanguBi TV', href: paths.app.admin.tv.getHref() },
              { label: 'Structure', href: paths.app.admin.org.getHref() },
            ]
          : []),
      ],
    },
    { label: 'Profil', icon: User, href: paths.app.profil.getHref() },
  ];

  return sections
    .filter(
      (s) =>
        (!s.adminOnly || isAdmin(user)) && (!s.clergyOnly || isClergy(user)),
    )
    .map((s) =>
      s.items
        ? { ...s, items: s.items.filter((i) => !i.clergyOnly || isClergy(user)) }
        : s,
    );
};

/**
 * État courant des query params discriminants (`?type=` Actus, `?tab=` Bible).
 * Rétro-compat : les consommateurs historiques (SidebarSections) passent la
 * seule VALEUR du param `type` (string | null) ; passer l'`URLSearchParams`
 * complet de l'URL courante permet en plus de discriminer `?tab=`.
 */
type CurrentSubNavParams = string | URLSearchParams | null;

const toSearchParams = (current: CurrentSubNavParams): URLSearchParams => {
  if (current === null) return new URLSearchParams();
  if (typeof current === 'string') {
    return new URLSearchParams({ [ACTUS_TYPE_PARAM]: current });
  }
  // Duck-typing plutôt qu'instanceof : couvre ReadonlyURLSearchParams de Next
  // et les doubles de test — seul `.get()` est utilisé.
  return current;
};

/**
 * Item de sous-nav actif ? Pour chaque param discriminant (`type`, `tab`) : un
 * item AVEC ce param dans son href n'est actif que si la valeur courante
 * correspond ; un item SANS (« Tout », Bible…) exige l'absence du param pour
 * éviter deux items actifs simultanés sur /app/actus ou /app/bible.
 */
export const isSubNavActive = (
  pathname: string,
  current: CurrentSubNavParams,
  href: string,
): boolean => {
  const [base, query = ''] = href.split('?');
  if (!isNavActive(pathname, base)) return false;
  const wanted = new URLSearchParams(query);
  const currentParams = toSearchParams(current);
  return SUBNAV_PARAMS.every((param) => {
    const wantedValue = wanted.get(param);
    if (wantedValue) return currentParams.get(param) === wantedValue;
    return currentParams.get(param) === null;
  });
};

/** Section active : via son href direct, sa racine, ou l'un de ses items. */
export const isSectionActive = (
  pathname: string,
  current: CurrentSubNavParams,
  section: NavSection,
): boolean => {
  if (section.href && isNavActive(pathname, section.href)) return true;
  if (
    section.activeRoot &&
    (pathname === section.activeRoot ||
      pathname.startsWith(`${section.activeRoot}/`))
  ) {
    return true;
  }
  return (section.items ?? []).some((item) =>
    isSubNavActive(pathname, current, item.href),
  );
};
