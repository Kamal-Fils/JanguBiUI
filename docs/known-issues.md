# Known Issues — baseline `check-types`

> Source de vérité du périmètre toléré par `yarn check-types`.
> Tout ce qui n'est **pas** listé ici doit être à **0 erreur**.

## Méthodologie du gate (corrigée — Chantier 7c)

`tsconfig.json` `include` couvre `**/*.ts` / `**/*.tsx` : **les tests sont
dans le périmètre**. Le gate doit donc comparer le **nombre absolu** d'erreurs
`yarn check-types` à la **baseline documentée ci-dessous** — et **non** un delta
type `git stash` (« 0 hors-baseline »), qui masque toute erreur déjà présente au
moment de la mesure (ou committée avant de stasher).

```bash
# Gate correct
test "$(yarn check-types 2>&1 | grep -cE 'error TS[0-9]+')" -le 3   # baseline LOT2-001
```

## Baseline documentée

### LOT2-001 — `apps/allo-pretre` (code mort, 3 erreurs `TS2339`)

| Fichier | Symbole importé absent de `api.ts` |
|---|---|
| `src/features/allo-pretre/api/get-ministers.ts` | `components['schemas']['MinisterList']` |
| `src/features/allo-pretre/api/mutations-parish.ts` | `components['schemas']['Parish']` |
| `src/features/allo-pretre/api/mutations-service.ts` | `components['schemas']['ServiceType']` |

**Cause** : le Chantier 6 a régénéré `src/types/api.ts` depuis `/api/schema/`
**sans** les schémas `/v1/availability/*` (l'app `availability` back n'est pas
branchée dans `apps/api/urls.py`). La feature `allo-pretre` (api + 3 composants
admin orphelins `admin-ministers/admin-parishes/admin-services`) n'est câblée
nulle part → **code mort**.

**Décision** : accepté comme baseline tant que `availability` n'est pas
réintégré (réactiver l'app back + endpoints + régénérer `api.ts`, puis recâbler
les composants orphelins). À la résolution, la baseline retombe à **0**.

## Historique (archéologie `check-types`)

| Point | Total | allo-pretre | tests org | Note |
|---|---|---|---|---|
| Lot 1 (`fbf8f5e`) | 9 | 0 | 0 | 9 = falso/sentry préexistants |
| C6 (`cdd06b4`) | 3 | 3 | 0 | corrige les 9 falso ; régen `api.ts` casse allo-pretre |
| 7a (`47d8072`) | 9 | 3 | 6 | +6 (onboarding 4, cascade 2) — corrigés en 7c |
| 7b (`12f318a`) | 12 | 3 | 9 | +3 (membership) — corrigés en 7c |
| 7c (réconciliation) | **3** | 3 | **0** | tests org rendus type-clean |
