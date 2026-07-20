# Déploiement — Supabase + Cloudflare R2 + Vercel

Guide pas-à-pas. Chaque valeur secrète est marquée 🔑 (à récupérer/coller par toi).
À la fin, chaque variable a **une seule** destination : le fichier `.env.local` (dev)
et **Vercel › Settings › Environment Variables** (prod).

---

## 1. Supabase (base de données)

1. Crée un projet sur https://supabase.com (région EU si possible) et note le
   **mot de passe de la base** (Database password) demandé à la création.
2. **Settings › API** → récupère deux valeurs :
   - `SUPABASE_URL` = **Project URL** (`https://<ref>.supabase.co`)
   - 🔑 `SUPABASE_SERVICE_ROLE_KEY` = clé **service_role** (Project API keys) OU la
     nouvelle **secret key** (`sb_secret_...`). L'app l'utilise côté serveur pour
     accéder à la base via l'API Supabase. **Serveur uniquement — jamais exposée au
     navigateur** (elle contourne le RLS).
3. **Créer les tables** : SQL Editor → New query → colle le contenu de
   [`infra/schema.sql`](infra/schema.sql) → **Run**. Ça crée les 8 tables + les
   triggers `updated_at` + le compte admin.

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
   Framework **Next.js** détecté automatiquement (build : `next build`,
   défini dans `vercel.json`).
2. **Environment Variables** : colle toutes les clés de `.env.local.template`
   (JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, S3_*, MAIL_*, FRONTEND_URL, ADMIN_*).
   - `JWT_SECRET` 🔑 : génère avec `openssl rand -hex 32`
   - `FRONTEND_URL` : mets l'URL Vercel du projet (ex. `https://uncommon-records.vercel.app`)
3. **Deploy**. Récupère l'URL finale et :
   - reporte-la dans `FRONTEND_URL` (redeploy) et dans le CORS R2 (étape 2.4).

---

## 4. Initialiser la base (une seule fois)

Les tables sont déjà créées (SQL Editor, étape 1.3) et le compte **admin** aussi.
Le contenu de **démo** (artistes, morceaux, events, sessions) est optionnel :

- soit tu le crées depuis le **dashboard admin** une fois connecté ;
- soit tu lances le seed en local (avec `.env.local` rempli : SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) :

```bash
npm install
npm run db:seed     # ajoute admin (si absent) + contenu de démo
```

> `db:seed` utilise l'API Supabase (service_role) et vise la même base que la prod.

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
| `SUPABASE_URL` | Supabase › Settings › API (Project URL) | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase › Settings › API (service_role / secret key) | 🔑 |
| `S3_ENDPOINT` | R2 (`https://<id>.r2.cloudflarestorage.com`) | |
| `S3_REGION` | `auto` | |
| `S3_BUCKET` | R2 (nom du bucket) | |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | R2 API token | 🔑 |
| `S3_PUBLIC_BASE_URL` | R2 public (`https://pub-xxx.r2.dev`) | 🔑 |
| `FRONTEND_URL` | URL Vercel | |
| `MAIL_*` | ton SMTP (optionnel) | 🔑 |
