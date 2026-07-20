# Déploiement — Supabase + Cloudflare R2 + Vercel

Guide pas-à-pas. Chaque valeur secrète est marquée 🔑 (à récupérer/coller par toi).
À la fin, chaque variable a **une seule** destination : le fichier `.env.local` (dev)
et **Vercel › Settings › Environment Variables** (prod).

---

## 1. Supabase (base de données)

1. Crée un projet sur https://supabase.com (région EU si possible) et note le
   **mot de passe de la base** (Database password) demandé à la création.
2. Barre du haut → bouton **Connect** → onglet **ORMs** (ou **Prisma**).
   - 🔑 `DATABASE_URL` = **Transaction pooler** (port **6543**). Ajoute à la fin
     `?pgbouncer=true&connection_limit=1` (obligatoire en serverless).
     Forme : `postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?...`
     → **C'est la seule variable DB requise** (runtime Vercel + seed).
   - `DIRECT_URL` = **OPTIONNELLE**. Sur Supabase c'est la chaîne « Session pooler »
     (port **5432**). Elle ne sert qu'à `prisma migrate` / `db push`. Comme on crée le
     schéma via le SQL Editor (étape suivante), **tu peux la laisser vide**.

   > Utilise Prisma via la connection string, **pas** le client `supabase-js` ni la
   > *secret API key* (celle-ci ne sert qu'à l'API REST de Supabase, non utilisée ici).

3. **Créer les tables** : SQL Editor → New query → colle le contenu de
   [`infra/schema.sql`](infra/schema.sql) → **Run**. Ça crée les 8 tables + le compte admin.

---

## 2. Cloudflare R2 (fichiers)

   Bucket déjà créé : **`uncommonrecords`** → `S3_BUCKET=uncommonrecords`.
   Endpoint (compte `6864227c...`) : `S3_ENDPOINT=https://6864227c9aced9e1d70dc269f2f65b83.r2.cloudflarestorage.com`
   ⚠️ l'endpoint ne contient **pas** `/uncommonrecords` (le SDK ajoute le bucket). Garde `S3_REGION=auto`.
2. **R2 › Manage R2 API Tokens › Create API token** → *Object Read & Write* :
   - 🔑 `S3_ACCESS_KEY_ID`
   - 🔑 `S3_SECRET_ACCESS_KEY`
3. **Accès public** (pour servir covers/audio) : bucket → **Settings › Public access** →
   active le domaine **r2.dev** (ou branche un domaine custom).
   → 🔑 `S3_PUBLIC_BASE_URL=https://pub-XXXX.r2.dev`
4. **CORS** (indispensable pour l'upload audio direct depuis le navigateur) :
   bucket → **Settings › CORS Policy** → colle le contenu de [`infra/r2-cors.json`](infra/r2-cors.json)
   en remplaçant l'origine par ton domaine Vercel (tu pourras l'ajouter après l'étape 3).

---

## 3. Vercel (hébergement)

1. https://vercel.com → **Add New › Project** → importe `lalzin/uncommon-records`.
   Framework **Next.js** détecté automatiquement (build : `prisma generate && next build`,
   défini dans `vercel.json`).
2. **Environment Variables** : colle toutes les clés de `.env.local.template`
   (JWT_SECRET, DATABASE_URL, DIRECT_URL, S3_*, MAIL_*, FRONTEND_URL, ADMIN_*).
   - `JWT_SECRET` 🔑 : génère avec `openssl rand -hex 32`
   - `FRONTEND_URL` : mets l'URL Vercel du projet (ex. `https://uncommon-records.vercel.app`)
3. **Deploy**. Récupère l'URL finale et :
   - reporte-la dans `FRONTEND_URL` (redeploy) et dans le CORS R2 (étape 2.4).

---

## 4. Initialiser la base (une seule fois)

Les tables sont déjà créées (SQL Editor, étape 1.3) et le compte **admin** aussi.
Le contenu de **démo** (artistes, morceaux, events, sessions) est optionnel :

- soit tu le crées depuis le **dashboard admin** une fois connecté ;
- soit tu lances le seed en local (avec `.env.local` rempli, `DATABASE_URL` suffit) :

```bash
npm install
npm run db:seed     # ajoute admin (si absent) + contenu de démo
```

> `db:seed` utilise le Prisma Client → **seul `DATABASE_URL` est nécessaire**
> (pas de `DIRECT_URL`). Il vise la même base Supabase que la prod.

Compte admin : `admin@uncommon-records.fr` / `UncommonAdmin2024!`
(**change le mot de passe** après la première connexion).

---

## 5. Vérifier

- Ouvre l'URL Vercel → pages publiques (Musique, Événements, Artistes, Sessions).
- `/login` avec le compte admin → dashboard admin.
- Ajoute un morceau avec un fichier audio → vérifie qu'il apparaît (upload R2 + lecture).

## Checklist des variables

| Variable | Source | 🔑 |
|---|---|:--:|
| `JWT_SECRET` | `openssl rand -hex 32` | 🔑 |
| `DATABASE_URL` | Supabase (transaction pooler 6543) | 🔑 |
| `DIRECT_URL` | Supabase (session pooler 5432) — *optionnel, migrations seulement* | |
| `S3_ENDPOINT` | R2 (`https://<id>.r2.cloudflarestorage.com`) | |
| `S3_REGION` | `auto` | |
| `S3_BUCKET` | R2 (nom du bucket) | |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | R2 API token | 🔑 |
| `S3_PUBLIC_BASE_URL` | R2 public (`https://pub-xxx.r2.dev`) | 🔑 |
| `FRONTEND_URL` | URL Vercel | |
| `MAIL_*` | ton SMTP (optionnel) | 🔑 |
