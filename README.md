# Uncommon Records — version Vercel (Next.js)

Réécriture de l'application Flask `uncommon-records` en **Next.js 14 (App Router, TypeScript)**,
déployable sur **Vercel**, avec :

- **Neon** (Postgres serverless) à la place de SQLite — via **Prisma**
- **S3 / Cloudflare R2** à la place du dossier `uploads/` local — gros fichiers audio uploadés
  en **direct-to-bucket** via URL présignée (contourne la limite de 4,5 Mo des fonctions serverless)
- **JWT** (`jose`) + **bcrypt** pour l'auth, identique au comportement Flask
- API REST sous `/api/*` (mêmes contrats que l'app Flask)

## Pourquoi cette architecture

Vercel exécute des fonctions **serverless éphémères** : pas de système de fichiers persistant,
pas de process long-running. Les trois points qui empêchaient un déploiement Flask direct ont été
résolus ainsi :

| Contrainte Vercel | Original (Flask) | Ici |
|---|---|---|
| Pas de FS persistant pour la DB | SQLite `instance/uncommon.db` | Postgres Neon (`DATABASE_URL`) |
| Pas de FS persistant pour les fichiers | `uploads/` local | Bucket S3/R2 + URLs présignées |
| Limite de taille du body serverless | upload audio 150 Mo en POST | upload direct navigateur → bucket |

## Stack

- Next.js 14 · React 18 · TypeScript
- Prisma 5 (`@prisma/client`)
- `@aws-sdk/client-s3` + `s3-request-presigner`
- `sharp` (redimensionnement images → webp, équivalent Pillow)
- `jose`, `bcryptjs`, `nodemailer`

## Arborescence

```text
uncommon-records-vercel/
  prisma/
    schema.prisma        # 8 modèles portés (User, Track, Event, Session, Comment, Like, Download, InviteToken)
    seed.ts              # port de run.py : admin + contenu de démo
  src/
    lib/                 # prisma, auth (jwt/bcrypt), storage (s3/r2), serializers, mail, youtube
    app/
      api/               # tous les endpoints REST (route handlers)
      page.tsx           # accueil
      music/ events/ artists/ login/  # pages publiques (React)
      globals.css        # design tokens repris de base.css
    components/Navbar.tsx
  vercel.json
  .env.example
```

## Mise en route locale

```bash
npm install
cp .env.example .env.local      # puis renseigner les valeurs
npx prisma db push              # crée le schéma sur Neon
npm run db:seed                 # admin + données de démo
npm run dev                     # http://localhost:3000
```

### Variables d'environnement

Voir `.env.example`. Les essentielles :

- `DATABASE_URL` (Neon **pooled**) + `DIRECT_URL` (Neon **direct**, pour les migrations)
- `S3_*` : `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`,
  et pour R2 : `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com` + `S3_REGION=auto`
- `JWT_SECRET`, `FRONTEND_URL`, `MAIL_*`

## Déploiement Vercel

1. **Neon** : créer un projet, récupérer les connection strings pooled + direct.
2. **Bucket** : créer un bucket S3 (ou R2). Le rendre lisible publiquement OU servir via CDN, et
   renseigner `S3_PUBLIC_BASE_URL`. Configurer le **CORS** du bucket pour autoriser les `PUT`
   présignés depuis votre domaine (`PUT`, `GET`, headers `*`, origine = votre URL Vercel).
3. **Import** du repo dans Vercel → framework détecté : Next.js.
4. Renseigner les variables d'environnement (mêmes clés que `.env.example`).
5. Build command (déjà dans `vercel.json`) : `prisma generate && next build`.
6. Après le premier déploiement, lancer une fois le schéma + seed :
   ```bash
   npx prisma db push      # ou: prisma migrate deploy
   npm run db:seed
   ```

## Mapping API (Flask → Next.js)

Tous les contrats JSON sont conservés. Exemples :

| Flask | Next.js route handler |
|---|---|
| `POST /api/auth/login` | `src/app/api/auth/login/route.ts` |
| `GET /api/auth/me` | `src/app/api/auth/me/route.ts` |
| `GET/POST /api/tracks` | `src/app/api/tracks/route.ts` |
| `.../tracks/<id>` GET/PUT/DELETE | `src/app/api/tracks/[id]/route.ts` |
| `/api/tracks/<id>/like|comments|stream|download` | sous-dossiers correspondants |
| `/api/tracks/promo[...]` | `src/app/api/tracks/promo/...` |
| `/api/events`, `/api/sessions`, `/api/artists`, `/api/admin/*` | dossiers homonymes |
| **nouveau** : `POST /api/uploads/presign` | URL présignée pour upload audio direct |

### Différence notable : upload audio

Au lieu d'envoyer le fichier audio dans le POST `multipart` (comme Flask), le front :

1. `POST /api/uploads/presign` `{ filename, content_type }` → `{ upload_url, key }`
2. `PUT upload_url` avec le fichier (navigateur → bucket directement)
3. `POST /api/tracks` avec le champ `audio_key` = `key` (au lieu du fichier `audio`)

Les petits fichiers peuvent toujours passer inline via le champ `audio` (fallback géré côté serveur).

## Migration des données existantes

La base de démo (`instance/uncommon.db`, ~49 Ko) est négligeable : le seed la recrée.
Pour migrer une vraie base SQLite de prod :

1. exporter les tables SQLite → CSV / SQL,
2. importer dans Neon (mêmes noms de colonnes : voir `@map(...)` dans `schema.prisma`),
3. uploader les fichiers de `backend/uploads/**` vers le bucket en conservant les chemins
   `covers/…`, `events/…`, `avatars/…`, `audio/…` (les clés stockées en base correspondent).

## Frontend porté

Toutes les pages de l'app Flask sont portées en React (App Router), branchées sur `apiClient.ts` :

- **Public** : Accueil, Musique, Événements, Artistes, Sessions, À propos, Login, Register (flux d'invitation), Promo (`/promo/[token]` : lecture, like, commentaires, téléchargement)
- **Dashboard Artiste** (`/dashboard/artist`) : aperçu + stats, CRUD de ses morceaux (upload audio direct → bucket), pool promo, édition de profil + avatar
- **Dashboard Admin** (`/dashboard/admin`) : statistiques + insights téléchargements, CRUD morceaux / événements / sessions / artistes, invitations artistes, gestion utilisateurs, liens promo
- **Newsletter** (footer) branchée sur `/api/events/newsletter-subscribe`
- **Toasts** + garde d'authentification par rôle (`clientAuth.ts`)

### Reste optionnel (polish, non bloquant)

- **i18n FR/EN** : l'original a un sélecteur de langue (`i18n.js`). Non reporté — l'UI est en
  français. À ajouter via un `LanguageContext` si besoin.
- **Lecteur audio global persistant** : ici chaque morceau a son `<audio>` inline (page Musique /
  Promo). Un mini-player flottant unique reste à faire si souhaité.
