# =================================================================
# STAGE 1 : deps
# Installe UNIQUEMENT les dépendances de production
# Ce stage sera jeté après — on garde juste node_modules
# =================================================================
FROM node:22-alpine AS deps

# Pourquoi alpine ?
# → Image Linux ultra-légère (~5MB vs ~200MB pour node:22)
# → Moins de surface d'attaque en sécurité
WORKDIR /app

# Copier SEULEMENT les fichiers de dépendances
# Pas tout le code — si le code change mais pas package.json,
# Docker réutilise le cache de ce layer (plus rapide)
COPY package.json yarn.lock ./

# --frozen-lockfile = échoue si yarn.lock ne correspond pas à package.json
# Garantit des versions exactes et reproductibles
RUN yarn install --frozen-lockfile

# =================================================================
# STAGE 2 : builder
# Compile le code TypeScript + optimise pour la production
# Ce stage sera aussi jeté — on garde juste le résultat du build
# =================================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Récupérer node_modules du stage précédent
COPY --from=deps /app/node_modules ./node_modules

# Copier tout le code source maintenant
COPY . .

# Désactiver la télémétrie Next.js (données envoyées à Vercel)
ENV NEXT_TELEMETRY_DISABLED=1

# Variables nécessaires au BUILD (pas seulement au runtime)
# NEXT_PUBLIC_* sont intégrées dans le bundle JS au moment du build
# → elles doivent exister ICI, pas seulement sur le serveur
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

# Sentry upload les source maps pendant le build
# Sans ce token → le build plante si Sentry est activé
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Le build Next.js :
# → Compile TypeScript
# → Optimise les images, CSS, JS
# → Génère le dossier .next/standalone (grâce à output: 'standalone')
RUN yarn build

# =================================================================
# STAGE 3 : runner
# Image finale ultra-légère qui tourne en production
# Contient SEULEMENT ce qui est nécessaire pour faire tourner l'app
# =================================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour la sécurité
# Ne jamais faire tourner une app en production en tant que root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier uniquement les fichiers nécessaires depuis le builder
# .next/standalone = le serveur Node.js minimal généré par Next.js
# .next/static     = les assets statiques (JS, CSS optimisés)
# public/          = images, fonts, fichiers publics

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs \
     /app/.next/static ./.next/static

# Basculer sur l'utilisateur non-root
USER nextjs

# Le port sur lequel Next.js écoute
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js = le mini-serveur Node.js généré par output: 'standalone'
# C'est lui qui remplace 'next start'
CMD ["node", "server.js"]