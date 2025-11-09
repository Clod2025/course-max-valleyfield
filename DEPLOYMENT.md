# 🚀 Guide de Déploiement - CourseMax

## Prérequis

- Node.js 18+ installé
- Compte Supabase avec projet créé
- Compte Stripe (mode production)
- Domaine configuré (optionnel)

## Étape 1 : Configuration Supabase

### 1.1 Créer le projet Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Noter l'URL et les clés API

### 1.2 Appliquer les migrations
```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

### 1.3 Configurer les Edge Functions
```bash
# Déployer toutes les fonctions
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
supabase functions deploy process-payment-connect
# ... déployer toutes les autres fonctions
```

### 1.4 Configurer les variables d'environnement dans Supabase
Dans le dashboard Supabase :
- Allez dans **Settings > Edge Functions > Secrets**
- Ajoutez :
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

## Étape 2 : Configuration Stripe

### 2.1 Créer un compte Stripe
1. Aller sur [stripe.com](https://stripe.com)
2. Créer un compte (mode production)
3. Activer le compte (vérification d'identité requise)

### 2.2 Configurer les webhooks
1. Aller dans **Developers > Webhooks**
2. Cliquer sur **Add endpoint**
3. URL : `https://votre-projet.supabase.co/functions/v1/stripe-webhook`
4. Événements à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Copier le **Signing secret** (commence par `whsec_`)

## Étape 3 : Build de Production

### 3.1 Installer les dépendances
```bash
npm install
```

### 3.2 Créer le fichier .env.production
```bash
cp .env.production.example .env.production
# Éditer .env.production avec vos vraies valeurs
```

### 3.3 Build
```bash
npm run build
```

Le dossier `dist/` contient les fichiers de production.

## Étape 4 : Déploiement

### Option A : Vercel (Recommandé)

1. Installer Vercel CLI :
```bash
npm install -g vercel
```

2. Déployer :
```bash
vercel --prod
```

3. Configurer les variables d'environnement dans le dashboard Vercel

### Option B : Netlify

1. Installer Netlify CLI :
```bash
npm install -g netlify-cli
```

2. Déployer :
```bash
netlify deploy --prod
```

3. Configurer les variables d'environnement dans le dashboard Netlify

### Option C : Autre plateforme

- Suivre les instructions de déploiement de votre plateforme
- S'assurer que les variables d'environnement sont configurées
- Vérifier que HTTPS est activé

## Étape 5 : Configuration Post-Déploiement

### 5.1 Domaine personnalisé
1. Configurer le domaine dans votre plateforme de déploiement
2. Ajouter les enregistrements DNS requis
3. Attendre la propagation DNS (peut prendre 24-48h)

### 5.2 Mise à jour des URLs
- Mettre à jour `VITE_APP_URL` dans `.env.production`
- Mettre à jour l'URL du webhook Stripe si nécessaire

### 5.3 SSL/HTTPS
- Vérifier que HTTPS est activé automatiquement
- Tester avec [SSL Labs](https://www.ssllabs.com/ssltest/)

## Étape 6 : Tests de Production

### 6.1 Tests fonctionnels
- [ ] Création de compte
- [ ] Connexion
- [ ] Ajout au panier
- [ ] Passage de commande
- [ ] Paiement (avec carte de test Stripe)
- [ ] Suivi de commande

### 6.2 Tests de sécurité
- [ ] HTTPS actif
- [ ] CORS configuré correctement
- [ ] Variables d'environnement non exposées
- [ ] RLS fonctionnel

### 6.3 Tests de performance
- [ ] Temps de chargement < 3s
- [ ] Bundle size < 500KB
- [ ] Images optimisées

## Étape 7 : Monitoring

### 7.1 Supabase Dashboard
- Surveiller les logs des Edge Functions
- Vérifier les erreurs de base de données
- Monitorer les performances

### 7.2 Stripe Dashboard
- Surveiller les paiements
- Vérifier les webhooks reçus
- Monitorer les erreurs

### 7.3 Analytics (Optionnel)
- Configurer Google Analytics
- Configurer Sentry pour les erreurs
- Configurer LogRocket pour les sessions

## Rollback en cas de problème

### Si le déploiement échoue :
1. Vérifier les logs de déploiement
2. Vérifier les variables d'environnement
3. Revenir à la version précédente si nécessaire

### Si le site est en panne :
1. Vérifier le statut de Supabase
2. Vérifier le statut de Stripe
3. Vérifier les logs d'erreur
4. Contacter le support si nécessaire

## Support

- Documentation Supabase : https://supabase.com/docs
- Documentation Stripe : https://stripe.com/docs
- Support CourseMax : [votre-email@support.com]

