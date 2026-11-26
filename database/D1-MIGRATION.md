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

La base D1 et le schéma ne rendent pas à eux seuls l'API PHP/MySQL compatible avec Cloudflare Workers. Le Worker du projet doit être relié au binding `DB` et les routes PHP doivent être portées vers une API Worker/Pages avant que le site hébergé lise et écrive dans D1. Garder MySQL et sa sauvegarde jusqu'à cette bascule et à la validation des opérations.
