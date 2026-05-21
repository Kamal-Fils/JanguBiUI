# Jàngu Bi — Frontend Implementation Plan

> Stack: Next.js 14, TanStack Query v5, Zustand, React Hook Form + Zod, shadcn/ui, Tailwind CSS  
> Architecture: Bulletproof React (feature-based, unidirectional imports)  
> Colors: `#70CBFF` dark-mode primary / `#1A8FCC` light-mode primary — matches landing page

---

## Status Legend
- ✅ Done
- 🔨 In progress
- ⬜ To do

---

## Phase 0 — Foundation ✅

| Task | Status |
|------|--------|
| Next.js 14 scaffold (Bulletproof React) | ✅ |
| Color tokens → #70CBFF blue family in all globals.css | ✅ |
| UserRole types (6 backend roles) | ✅ |
| Authorization helpers per role | ✅ |
| Bottom nav: Accueil / Actus / Spirituel / Messages / Profil | ✅ |
| Auth layer (login / register / logout / useUser) | ✅ |
| API client (Axios + JWT interceptor) | ✅ |
| UI primitives (Button, Card, Dialog, Form, Input, Badge…) | ✅ |

---

## Phase 1 — Fidèle Core ⬜

### 1.1 Accueil (`/app`)
- [x] Welcome banner + quick-access grid (partial)
- [ ] Daily liturgie card (lectures du jour from AELF)
- [ ] Articles de ma paroisse strip (requires parishId in profile)
- [ ] `features/home/api/get-home.ts`

### 1.2 Actualités (`/app/actus`) ⬜
- [ ] `features/news/api/get-articles.ts` — list with `scope` + `limit/offset`
- [ ] `features/news/api/get-article.ts` — article detail
- [ ] `features/news/components/article-card.tsx` — variants: hero, default, compact, minimal
- [ ] `features/news/components/articles-feed.tsx` — tabs: Mondiale / Ma paroisse / Mon diocèse
- [ ] `app/app/actus/page.tsx`
- [ ] `app/app/actus/[id]/page.tsx`

### 1.3 Spirituel (`/app/spirituel`) 🔨
- [x] Bible — testaments → books → chapters → verses
- [x] Chapelet — mystère du jour + guide prière
- [ ] Liturgie (`/app/spirituel/liturgie`) — 8 offices canoniques
  - `features/liturgy/api/get-offices.ts`
  - `features/liturgy/components/office-card.tsx` — accordion, gold-surface citations
- [ ] TV (`/app/spirituel/tv`) — YouTube live + replay par catégorie
  - `features/tv/api/get-videos.ts`
  - `features/tv/components/video-card.tsx`
- [ ] Bottom sheet selector: Bible / Chapelet / Liturgie / TV

### 1.4 Messagerie (`/app/messages`) ⬜
- [ ] `features/messaging/api/get-conversations.ts`
- [ ] `features/messaging/api/get-messages.ts`
- [ ] `features/messaging/hooks/use-chat-socket.ts` — WebSocket via Django Channels, JWT auth
- [ ] `features/messaging/components/conversation-list.tsx`
- [ ] `features/messaging/components/chat-window.tsx` — bubbles, emoji reactions
- [ ] `features/messaging/components/new-conversation-drawer.tsx`
- [ ] Badge unread count wired to BottomNav via Zustand
- [ ] `app/app/messages/page.tsx`
- [ ] `app/app/messages/[id]/page.tsx`

### 1.5 Mes Documents (`/app/documents`) ⬜
- [ ] `features/documents/api/get-documents.ts`
- [ ] `features/documents/api/create-document.ts`
- [ ] `features/documents/components/document-status-badge.tsx` — 6 statuses
- [ ] `features/documents/components/new-document-form.tsx` — type selector
- [ ] `features/documents/components/document-detail.tsx` — status timeline
- [ ] `app/app/documents/page.tsx`
- [ ] `app/app/documents/new/page.tsx`
- [ ] `app/app/documents/[id]/page.tsx`

### 1.6 Profil (`/app/profil`) ⬜
- [ ] `features/profile/api/update-profile.ts`
- [ ] `features/profile/api/change-password.ts`
- [ ] `features/profile/api/delete-account.ts`
- [ ] `features/profile/components/profile-form.tsx`
- [ ] `features/profile/components/security-form.tsx`
- [ ] `app/app/profil/page.tsx`

---

## Phase 2 — Admin Back-office ⬜

### 2.1 Shared Admin Shell
- [ ] `components/layouts/admin-shell.tsx` — sidebar (desktop) + drawer (mobile)
- [ ] Role guard middleware — redirect fidèle to `/app`
- [ ] `app/admin/layout.tsx`

### 2.2 Parish / Church Admin (`/admin/paroisse`)
- [ ] Dashboard: counters (pending docs, draft articles, unread messages)
- [ ] Articles: list + create + edit + publish + unpublish (church_admin cannot unpublish)
- [ ] Document queue: filter status/type/date + action buttons workflow

### 2.3 Diocese Admin (`/admin/diocese`)
- [ ] Dashboard: paroisse stats aggregation
- [ ] Articles diocésains (scope=diocese)
- [ ] Consolidated document view (diocese)
- [ ] Parish admin user management (create/activate/deactivate)

### 2.4 Province Admin (`/admin/province`)
- [ ] Dashboard: diocese stats
- [ ] Diocese admin management

### 2.5 Super Admin (`/admin/super`)
- [ ] Global dashboard
- [ ] All users CRUD + audit logs
- [ ] All articles transversal view
- [ ] TV management (videos + categories)

---

## Phase 3 — Polish ⬜

- [ ] Dark/light theme toggle (next-themes)
- [ ] Skeleton loaders for all list views
- [ ] Error boundaries per feature
- [ ] PWA manifest + offline splash screen
- [ ] E2E tests (Playwright): login, read article, create document, send message
- [ ] Storybook stories: ArticleCard, DocumentStatusBadge, OfficeCard

---

## Route Map

```
/auth/login              → Login
/auth/register           → Register

/app                     → Accueil fidèle
/app/actus               → Feed articles (tabs: global/diocese/parish)
/app/actus/[id]          → Article detail
/app/spirituel           → Bottom sheet: Bible / Chapelet / Liturgie / TV
/app/spirituel/bible     → Bible navigation
/app/spirituel/chapelet  → Rosaire
/app/spirituel/liturgie  → Offices canoniques
/app/spirituel/tv        → TV catholique
/app/messages            → Conversations list
/app/messages/[id]       → Chat window
/app/documents           → Mes demandes de documents
/app/documents/new       → Nouvelle demande
/app/documents/[id]      → Détail + historique statuts
/app/profil              → Mon profil + sécurité

/admin                   → Redirect vers dashboard selon rôle
/admin/paroisse          → Parish / Church admin back-office
/admin/diocese           → Diocese admin back-office
/admin/province          → Province admin back-office
/admin/super             → Super admin console
```

---

## Role → Route Access Matrix

| Route | fidele | church_admin | parish_admin | diocese_admin | province_admin | super_admin |
|-------|:------:|:------------:|:------------:|:-------------:|:--------------:|:-----------:|
| `/app/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/admin/paroisse` | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `/admin/diocese` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| `/admin/province` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/admin/super` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Document Status Colors (DESIGN.md §4.3)

| Backend status | Badge color | Label |
|----------------|-------------|-------|
| `submitted` | Info (blue) | Soumise |
| `under_verification` | Warning (orange) | En vérification |
| `info_requested` | Warning (orange) | Complément demandé |
| `validated` | Success (green) | Validée |
| `rejected` | Destructive (red) | Rejetée |
| `document_deposited` | Primary (#70CBFF) | Document disponible |

---

## Next Session Priority

1. `features/news` — ArticleCard variants + articles feed with tabs
2. `features/liturgy` — OfficeCard + offices list from AELF API
3. `features/messaging` — WebSocket hook + chat UI
4. `features/documents` — request form + status timeline
