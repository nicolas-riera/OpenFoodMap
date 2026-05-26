# OpenFoodMap — Community Map Design Spec

**Date:** 2026-05-26
**Contexte:** Hackathon Fondation Free — Défi 1 Open Food Facts

---

## Contexte

Open Food Facts est un projet mondial avec 30 000+ contributeurs dans 160+ pays, mais il n'existe aucun moyen de visualiser cette communauté. L'objectif est de créer une carte interactive où les contributeurs peuvent s'inscrire et se présenter brièvement, à l'image de la community map de Wikipédia.

Points d'attention imposés par le brief : **privacy**, **modération**, **authentification**.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Carte | Leaflet.js |
| Auth | NextAuth.js — OAuth2 avec Keycloak OFF |
| Base de données | PostgreSQL + Prisma ORM |
| Déploiement | Docker Compose (tourne en local) |

100% open source, zéro service externe payant. Portable vers les serveurs d'OFF à terme.

```bash
docker compose up  # démarre Next.js :3000 + PostgreSQL :5432
```

---

## Modèle de données

### Table `contributors`

| Champ | Type | Notes |
|---|---|---|
| `id` | uuid | clé primaire |
| `off_username` | string | récupéré via OAuth, unique |
| `off_user_id` | string | ID interne OFF, jamais exposé publiquement |
| `bio` | string | 280 chars max, optionnel |
| `languages` | string[] | langues parlées |
| `location_type` | enum | `country` / `city` / `neighborhood` |
| `location_label` | string | ex. "Lyon, France" |
| `location_lat` | float | centre de la zone choisie, jamais l'adresse exacte |
| `location_lng` | float | centre de la zone choisie |
| `status` | enum | `pending` / `approved` / `rejected` |
| `created_at` | timestamp | |

### Table `reports`

| Champ | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `contributor_id` | uuid | FK → contributors |
| `reason` | string | |
| `created_at` | timestamp | |

**Règle privacy :** on stocke uniquement le centre de la zone choisie par le contributeur, jamais ses coordonnées exactes.

---

## API Routes (Next.js)

| Route | Méthode | Auth requise | Description |
|---|---|---|---|
| `/api/contributors` | GET | Non | Liste tous les contributeurs `approved` avec lat/lng |
| `/api/contributors` | POST | Session OFF | Crée ou met à jour son propre profil |
| `/api/contributors/[id]` | GET | Non | Détail d'un profil approuvé |
| `/api/report` | POST | Session OFF | Signale un profil |
| `/api/moderation` | GET | Modérateur | Liste les profils `pending` et signalés |
| `/api/moderation/[id]` | PATCH | Modérateur | Approuve ou rejette un profil |

---

## Pages et composants clés

### `/` — Carte principale
- Carte Leaflet.js plein écran
- Navbar : logo OFF, compteur contributeurs, bouton "S'inscrire", toggle dark/light
- Pins orange OFF (`#f0820f`) pour les profils approuvés, gris pour `pending`
- Clic sur un pin → popup profil compact
- Légende : validé / en attente

### Popup profil (compact)
- Avatar OFF + pseudo + pays/ville
- Bio courte + nb contributions + langues
- Bouton "Voir plus ↓" → expand avec infos supplémentaires
- Bouton "Signaler" discret

### `/register` — Inscription (3 étapes)

**Étape 1 — Connexion**
- Bouton "Se connecter avec OFF" → OAuth Keycloak OFF
- NextAuth gère le flow, session créée côté serveur

**Étape 2 — Localisation**
- Sélecteur de précision : `Pays` / `Ville` / `Quartier`
- Deux modes au choix :
  - **Adresse** : champ de recherche textuelle (geocoding via Nominatim, open source)
  - **Clic carte** : mini-carte Leaflet, l'utilisateur pose son pin directement
- Le pin final est automatiquement snapé au centroïde de la zone (reverse geocoding Nominatim), quelle que soit la position exacte cliquée — garantit la privacy même en mode "Quartier"

**Étape 3 — Profil**
- Bio : textarea 280 chars max, optionnel
- Langues : tags multi-sélection
- Soumission → statut `pending`, message "Visible après validation (24–48h)"

### `/moderation` — Interface modérateur
- Accès restreint aux comptes OFF avec rôle `moderator` (vérifié via le token Keycloak)
- File des profils `pending` : Valider / Rejeter
- Profils signalés mis en évidence
- Historique des décisions récentes

---

## Flux principal

```
Contributeur OFF
  → clique "S'inscrire"
  → NextAuth redirige vers Keycloak OFF
  → retour avec session (off_username, off_user_id)
  → choisit localisation (adresse ou clic carte)
  → remplit bio + langues (optionnel)
  → profil créé en statut "pending"
  → modérateur valide dans l'interface /moderation
  → pin orange apparaît sur la carte
```

---

## Modération et privacy

- **Auth** : OAuth OFF via Keycloak — seuls les vrais contributeurs OFF peuvent s'inscrire
- **Modération** : file d'attente 24–48h, modérateurs OFF valident/rejettent. Les profils `pending` sont visibles sur la carte en gris (transparence) mais sans popup accessible au public.
- **Privacy** :
  - Localisation : uniquement le centre de la zone choisie, jamais l'adresse exacte
  - `off_user_id` stocké en DB mais jamais exposé via l'API publique
  - Bouton "Signaler" sur chaque profil approuvé
- **Suppression** : le contributeur peut supprimer son profil à tout moment depuis son compte

---

## Geocoding

Nominatim (OpenStreetMap) pour la recherche d'adresses — open source, sans clé API, auto-hébergeable. Limite : 1 req/s en usage public, suffisant pour les inscriptions.

---

## Dark / Light mode

Toggle dans la navbar. Palette de couleurs à définir. Les deux modes partagent les mêmes pins orange OFF (`#f0820f`). Fond de carte : CartoDB Dark Matter (dark) / CartoDB Positron (light) — tous deux disponibles sans clé API.

---

## Hors scope (hackathon)

- Notifications email aux modérateurs (à implémenter en post-hackathon)
- Clustering des pins pour les zones denses
- Filtres sur la carte (par langue, nb de contributions, etc.)
- Internationalisation (i18n)
