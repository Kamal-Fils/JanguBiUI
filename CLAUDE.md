# CLAUDE.md — JanguBiUI (Frontend Next.js)

Frontend de la plateforme **Jàngu Bi** — Next.js 14 App Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui.

> Voir le CLAUDE.md racine (`../CLAUDE.md`) pour les règles d'orchestration agents/skills.

---

## Commandes

```bash
# Depuis JanguBiUI/
yarn dev          # Serveur de développement (port 3000)
yarn build        # Build production — doit être clean (0 erreurs TS)
yarn test         # Vitest — tous les tests doivent passer (222/222)
yarn test:watch   # Mode watch
yarn lint         # ESLint
yarn type-check   # tsc --noEmit
```

API backend : `http://localhost:8000/api/v1/`

---

## Architecture — Bulletproof React (CRITIQUE)

```
src/
├── app/              # Next.js App Router — pages et layouts
├── components/       # Composants partagés toute l'application
│   └── ui/           # Primitives UI (Button, Input, Dialog…)
├── config/           # Configuration et exports env
│   └── paths.ts      # Toutes les routes — NE PAS hardcoder les URLs
├── features/         # Modules feature-based — cœur du codebase
├── hooks/            # Hooks partagés
├── lib/              # Bibliothèques préconfigurées (api-client, auth)
├── stores/           # Stores Zustand globaux
├── testing/          # Utilitaires de test, handlers MSW, factories
├── types/            # Types TypeScript partagés
└── utils/            # Fonctions utilitaires partagées
```

### Structure d'une feature

```
src/features/<nom>/
├── api/         # Hooks react-query + fetchers (un fichier par endpoint)
├── components/  # Composants scopés à cette feature
│   └── __tests__/
├── hooks/       # Hooks scopés à cette feature
├── stores/      # Stores Zustand locaux à cette feature
├── types/       # Types TypeScript de cette feature
└── utils/       # Utilitaires de cette feature
```

### Règles d'import (CRITIQUES — enforce par ESLint)

- **Jamais** d'import cross-feature (`features/auth` ne peut pas importer depuis `features/news`)
- Flux unidirectionnel : `shared → features → app`
- **Pas de barrel files** (`index.ts`) — casse le tree-shaking

---

## Couche API

**Un seul client Axios** dans `src/lib/api-client.ts`. Ne jamais appeler `fetch()` ou `axios` directement dans les composants.

Chaque endpoint = un fichier dans `src/features/<nom>/api/` avec :
1. **Schéma Zod** — valide et type la réponse
2. **Fetcher** — appelle `api.get/post/patch/delete`
3. **Hook react-query** — `useQuery` ou `useMutation`

```typescript
// Pattern standard query
export const useMyData = () =>
  useQuery({ queryKey: ['my-data'], queryFn: () => api.get('/my-data/') });

// Pattern standard mutation
export const useCreateThing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Input) => api.post('/things/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['things'] }),
  });
};
```

---

## Authentification

- `useUser()` depuis `src/lib/auth.tsx` — source de vérité pour l'utilisateur connecté
- Token JWT stocké dans localStorage (patterns existants du projet)
- `clearAccessToken()` / `clearRefreshToken()` avant tout redirect logout
- Le 401 handler dans `api-client.ts` redirige vers `/auth/login` UNIQUEMENT si `!window.location.pathname.startsWith('/auth/')` (évite la boucle infinie)

---

## Autorisation — `src/lib/authorization.ts`

Fonctions existantes à NE PAS dupliquer :

```typescript
isAdmin(user)                // Tout rôle admin
isSuperAdmin(user)           // super_admin uniquement
isProvinceAdminOrAbove(user) // province_admin | super_admin
isDioceseAdminOrAbove(user)  // diocese_admin et au-dessus
isParishLevelAdmin(user)     // parish_admin | church_admin
isFidele(user)               // fidele uniquement
canCreateArticle(user)       // Peut créer un article
canPublishArticle(user)      // Peut publier un article
canProcessDocuments(user)    // Peut traiter des documents
canManageUsers(user)         // Peut gérer les utilisateurs
canManageTV(user)            // Peut gérer JanguBi TV
```

Fonctions à ajouter (pas encore implémentées) :
```typescript
isClergy(user)          // archeveque | eveque | pretre | diacre | religieux
isPretre(user)          // pretre uniquement
isEvequeOrAbove(user)   // eveque | archeveque
```

---

## Tests

- **Framework** : Vitest + Testing Library + MSW
- **Co-location** : `src/features/<nom>/components/__tests__/<nom>.test.tsx`
- **Jamais** mocker `fetch` ou `api` directement — toujours passer par MSW
- Helper central : `src/testing/test-utils.tsx` → `renderApp({ route })`
- État actuel : **222/222 tests passent**

```bash
# Un seul test
cd JanguBiUI && yarn test --reporter=verbose src/features/bible
```

---

## Features existantes

| Page | Status | Route |
|---|---|---|
| Auth (login, register, reset, verify) | ✅ | `/auth/*` |
| Bible | ✅ | `/app/bible` |
| Chapelet | ✅ | `/app/chapelet` |
| Liturgie du jour | ✅ | `/app/spirituel/liturgie` |
| Messagerie WebSocket | ✅ | `/app/messages/*` |
| Documents (fidèle : créer + suivre) | ✅ | `/app/documents/*` |
| Actus (lecture seule) | ✅ | `/app/actus/*` |
| JanguBi TV (lecture seule) | ✅ | `/app/tv` |
| Assistant spirituel RAG | ✅ | `/app/assistant` |
| Profil utilisateur | ✅ | `/app/profil` |
| Admin availability (placeholder vide) | ⚠️ | `/app/admin/availability` |

## Features manquantes (priorité SRS)

| Feature | Priorité |
|---|---|
| Navigation conditionnelle par rôle | 🔴 P1 |
| Dashboard fidèle scopé à sa paroisse | 🔴 P1 |
| Onboarding : sélection paroisse obligatoire | 🔴 P1 |
| Dashboard prêtre (intentions, messagerie, liturgie) | 🔴 P2 |
| Dashboard évêque + archevêque | 🔴 P2 |
| CMS Articles (créer, éditer, publier — 3 types) | 🔴 P2 |
| Admin workflow documents (changer statut) | 🟡 P3 |
| TV management (CRUD vidéos) | 🟡 P3 |
| Gestion utilisateurs admin | 🟡 P3 |
| Liturgie des Heures (7 offices) | 🔴 P1 |
| Allo-Prêtre (fidèle) | 🔴 P2 |
| Inter-clergé messaging | 🔴 P2 |

---

## Agents Claude à utiliser — Frontend

| Situation | Agent / Skill |
|---|---|
| Avant toute nouvelle feature | `react-feature-architect` |
| Écrire les tests avant d'implémenter | `react-tdd-assistant` |
| Review après chaque modification React | `react-reviewer` |
| Mise en place gestion d'erreurs | `react-error-handler` |
| Référence nouvelle feature Bulletproof | skill `react-new-feature` |
| Auth pattern, cookies, useUser | skill `react-auth` |
| Tests Vitest + MSW + Playwright | skill `react-testing` |
| Design system, shadcn, Tailwind | skill `frontend-design` |
| Composition, state types, URL state | skill `frontend-patterns` |
| Swiper, animations, transitions | skill `frontend-slides` |

---

## Composants orphelins (construits mais non intégrés)

Ces composants existent et fonctionnent — les intégrer en priorité plutôt que recréer :

- `src/features/allo-pretre/components/admin-ministers.tsx` → CRUD ministres
- `src/features/allo-pretre/components/admin-parishes.tsx` → CRUD paroisses
- `src/features/allo-pretre/components/admin-services.tsx` → CRUD services

Destination : `src/app/app/admin/availability/page.tsx` (actuellement placeholder vide).

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composant | PascalCase | `ReadingsSwiper`, `ArticleCard` |
| Hook | `use` prefix | `useMyParishArticles` |
| Fichier API | verb-noun | `get-articles.ts`, `create-document.ts` |
| Store | noun + `Store` | `notificationsStore` |
| Test | `__tests__/name.test.tsx` | co-localisé avec la source |
