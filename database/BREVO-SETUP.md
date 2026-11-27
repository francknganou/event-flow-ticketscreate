# Connecter les e-mails transactionnels Brevo

EventFlow utilise l'API HTTP transactionnelle de Brevo depuis le Cloudflare Worker. La clé est stockée comme secret Worker et n'est jamais incluse dans le dépôt ou le navigateur.

## 1. Préparer Brevo

Dans Brevo, créez une clé API depuis **Paramètres → SMTP & API → Clés API**, puis ajoutez une adresse expéditeur et terminez sa vérification. Pour une meilleure réception, authentifiez le domaine expéditeur avec les enregistrements DNS SPF/DKIM/DMARC proposés par Brevo.

## 2. Enregistrer les secrets du Worker

À la racine du projet, exécutez les commandes séparément. Wrangler demande la valeur dans le terminal; ne la collez pas dans GitHub, dans le code ou dans une conversation.

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put BREVO_SENDER_EMAIL
```

La première valeur est la clé API. La seconde est l'adresse **exactement vérifiée** comme expéditeur dans Brevo. Le nom d'expéditeur est `EventFlow` par défaut.

## 3. Envoyer un e-mail de test

Une fois les secrets enregistrés et le compte administrateur connecté sur le site, ouvrez le tableau de bord et utilisez **Tester l’e-mail**. Le message est envoyé à l'adresse du compte administrateur connecté. Le Worker limite les essais à trois par heure et journalise le résultat dans `audit_logs`.

Une réponse positive signifie que Brevo a accepté le message pour traitement. Vérifiez ensuite la boîte de réception, les courriers indésirables et les journaux transactionnels Brevo pour confirmer son état de livraison.

## État actuel

Cette intégration ajoute la connexion fournisseur et le test administrateur. Elle ne déclenche pas encore l'envoi automatique des billets, factures ou rappels : ces flux métier devront appeler le service après leur migration complète vers D1.
