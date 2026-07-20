# Déploiement — Neon + Cloudflare R2 + Vercel

Guide pas-à-pas. Chaque valeur secrète est marquée 🔑 (à récupérer/coller par toi).
À la fin, chaque variable a **une seule** destination : le fichier `.env.local` (dev)
et **Vercel › Settings › Environment Variables** (prod).

---

## 1. Neon (base de données)

1. Crée un compte sur https://neon.tech → **New Project** (région EU si possible).
2. Dans **Connection Details**, copie deux chaînes :
   - 🔑 `DATABASE_URL` → coche **Pooled connection** (finit par `-pooler...`)
   - 🔑 `DIRECT_URL` → **décoche** Pooled (connexion directe, pour les migrations)

---

## 2. Cloudflare R2 (fichiers)

1. Cloudflare Dashboard → **R2** → **Create bucket** : nom `uncommon-uploads`.
   → renseigne `S3_BUCKET=uncommon-uploads`.
2. **R2 › Manage R2 API Tokens › Create API token** → *Object Read & Write* :
   - 🔑 `S3_ACCESS_KEY_ID`
   - 🔑 `S3_SECRET_ACCESS_KEY`
   - l'écran affiche aussi l'endpoint S3 : `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
     → renseigne `S3_ENDPOINT` (garde `S3_REGION=auto`).
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

En local, avec le `.env.local` rempli (mêmes valeurs que Vercel) :

```bash
npm install
npm run db:push     # crée le schéma sur Neon (utilise DIRECT_URL)
npm run db:seed     # admin + contenu de démo
```

> `db:push` et `db:seed` visent la **même** base Neon que la prod : tu peux donc
> l'exécuter depuis ta machine, pas besoin d'un shell sur Vercel.

Compte admin créé : `admin@uncommon-records.fr` / `UncommonAdmin2024!`
(**change le mot de passe** via `ADMIN_PASSWORD` avant le seed en prod réelle).

---

## 5. Vérifier

- Ouvre l'URL Vercel → pages publiques (Musique, Événements, Artistes, Sessions).
- `/login` avec le compte admin → dashboard admin.
- Ajoute un morceau avec un fichier audio → vérifie qu'il apparaît (upload R2 + lecture).

## Checklist des variables

| Variable | Source | 🔑 |
|---|---|:--:|
| `JWT_SECRET` | `openssl rand -hex 32` | 🔑 |
| `DATABASE_URL` | Neon (pooled) | 🔑 |
| `DIRECT_URL` | Neon (direct) | 🔑 |
| `S3_ENDPOINT` | R2 (`https://<id>.r2.cloudflarestorage.com`) | |
| `S3_REGION` | `auto` | |
| `S3_BUCKET` | R2 (nom du bucket) | |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | R2 API token | 🔑 |
| `S3_PUBLIC_BASE_URL` | R2 public (`https://pub-xxx.r2.dev`) | 🔑 |
| `FRONTEND_URL` | URL Vercel | |
| `MAIL_*` | ton SMTP (optionnel) | 🔑 |
