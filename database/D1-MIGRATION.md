# Migration EventFlow vers Cloudflare D1 (offre gratuite)

D1 repose sur SQLite : le schéma MySQL a donc été converti. L'export conserve les identifiants, mots de passe hachés, événements, commandes et autres données présents dans `eventflow`.

## Préparer l'accès Cloudflare

Dans un terminal à la racine du projet, installer Wrangler si nécessaire puis se connecter au compte Cloudflare :

```powershell
npm install --save-dev wrangler
npx wrangler login
```

Créer la base D1 (le compte consulté avait encore 10 bases disponibles sur 10) :

```powershell
npx wrangler d1 create eventflow
```

La commande affiche un `database_id`. Après création, ajouter ce bloc dans `wrangler.jsonc` à la racine du projet, en remplaçant l'identifiant :

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "eventflow",
    "database_id": "ID_AFFICHE_PAR_WRANGLER"
  }
]
```

## Créer le schéma et transférer les lignes

```powershell
npx wrangler d1 execute eventflow --remote --file=database/d1-schema.sql
php database/export-mysql-to-d1.php > "$env:TEMP/eventflow-d1-data.sql"
npx wrangler d1 execute eventflow --remote --file="$env:TEMP/eventflow-d1-data.sql"
```

Contrôler les volumes après import :

```powershell
npx wrangler d1 execute eventflow --remote --command="SELECT 'users' AS table_name, COUNT(*) AS rows FROM users UNION ALL SELECT 'events', COUNT(*) FROM events UNION ALL SELECT 'bookings', COUNT(*) FROM bookings UNION ALL SELECT 'plans', COUNT(*) FROM plans;"
```

L'export temporaire contient des données personnelles et des empreintes de mots de passe : ne pas le publier ni l'ajouter à Git. Le script écrit seulement le fichier demandé et n'imprime pas son contenu dans le terminal.

## Limite à connaître

Le Worker est relié au binding `DB`. Il sert maintenant le catalogue public des événements, les formules, la lecture d'abonnement, la liste d'abonnements côté administrateur et un résumé du tableau de bord. Les écritures d'événements, commandes, paiements, remboursements, scans, messagerie et ajustements administrateur restent à porter avant de pouvoir être utilisées sur Cloudflare.

## Appliquer le modèle additionnel marketplace

Après que `d1-schema.sql` et les données MySQL ont été importés, appliquer une seule fois le schéma complémentaire (21 tables et règles de quota/stock) :

```powershell
npx wrangler d1 execute eventflow --remote --file=database/marketplace-v2-d1.sql
```

Cette migration ajoute les tables et colonnes du modèle marketplace; elle ne doit pas être exécutée une seconde fois, car les colonnes ajoutées avec `ALTER TABLE` ne sont pas idempotentes. Vérifier le résultat :

```powershell
npx wrangler d1 execute eventflow --remote --command="SELECT id,name FROM plans ORDER BY monthly_price;"
npx wrangler d1 execute eventflow --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Après l'évolution du schéma, copier les données des tables historiques vers les tables normalisées. Le fichier est idempotent et laisse les comptes utilisateurs et administrateurs intacts :

```powershell
npx wrangler d1 export eventflow --remote --output="$env:TEMP/eventflow-before-backfill.sql"
npx wrangler d1 execute eventflow --remote --file=database/backfill-marketplace-v2.sql
```

Les anciens QR chiffrés restent dans `issued_tickets`; ils ne sont pas convertis en nouveaux jetons, car leur clé de déchiffrement n'est pas configurée comme secret Worker.

Conserver MySQL et sa sauvegarde jusqu'à validation de la migration et de toutes les routes métier. Les paiements restent inactifs tant que leurs prestataires et webhooks signés ne sont pas configurés.
