# EventFlow

Application de billetterie React, PHP et MySQL conçue pour un lancement local avec WampServer.

## Démarrage local

1. Démarrer MySQL dans WampServer.
2. Pour une nouvelle installation, importer `database/schema.sql` dans phpMyAdmin ou MySQL. La base EventFlow de cette installation a déjà été migrée.
4. Installer les dépendances une première fois avec `npm ci`.
5. Dans un terminal, depuis ce dossier, démarrer l’API : `C:\wamp64\bin\php\php8.3.14\php.exe -S 127.0.0.1:8000`.
6. Dans un second terminal, lancer le site avec `npm run dev` puis ouvrir `http://localhost:8080`.

La configuration locale attend MySQL sur `127.0.0.1`, base `EventFlow`, utilisateur `root` sans mot de passe (valeurs WampServer par défaut). Les comptes participants se créent depuis Inscription. Le compte administrateur local est `franck06.nganou02oumbe2004@gmail.com` ; son mot de passe a été remplacé comme demandé.

## Capacités présentes

- Création d’événements avec plusieurs catégories de billets, tarifs et quantités.
- Réservation avec vérification du stock en transaction, réservation payante temporaire de 15 minutes et retour du stock après expiration.
- QR de billets confirmés signé par HMAC, chiffré dans la base et vérifié une seule fois par le scanner administrateur.
- Tableau de bord avec ventes, revenus confirmés, participants, contrôle des entrées, stock et journal d’activité.
- Chaque événement est rattaché à un compte organisateur. L’administrateur peut créer des événements ; les participants peuvent demander l’accès organisateur, soumis à validation depuis le tableau de bord administrateur.
- Espace organisateur avec indicateurs et événements limités au propriétaire, règles de réservation basées sur le statut, période de vente et limite par type de billet.
- Accès API par jeton expirant, hachage des mots de passe, requêtes préparées et limitation des tentatives sur les parcours sensibles.
- Export imprimable des billets; le navigateur peut enregistrer la page d’impression en PDF.
- Compilation de l’application sur push et pull request avec GitHub Actions (`.github/workflows/build.yml`).

## Intégrations à configurer avant une mise en production

Les paiements en ligne, leur webhook signé, les e-mails/SMS, l’hébergement d’images, le déploiement HTTPS, l’hébergement cloud, les sauvegardes, la file d’attente et le cache nécessitent des fournisseurs et des identifiants qui ne sont pas configurés ici. Tant qu’aucun prestataire de paiement n’est relié, une réservation payante reste en attente et aucun billet n’est émis. Les politiques CGV, remboursement, confidentialité, commissions, facturation et reversement sont également à définir pour l’organisateur.
