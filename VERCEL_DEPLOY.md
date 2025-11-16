# 🚀 Guide de déploiement Vercel

## ✅ Étape 1 : Vérification GitHub

Le projet est déjà sur GitHub : https://github.com/StudioVBG/Gestion-Immo

## 📋 Étape 2 : Déployer sur Vercel

### 2.1 Se connecter à Vercel

1. Allez sur **https://vercel.com**
2. Cliquez sur **"Sign Up"** ou **"Log In"**
3. Choisissez **"Continue with GitHub"**
4. Autorisez Vercel à accéder à vos dépôts GitHub

### 2.2 Importer le projet

1. Cliquez sur **"Add New..."** → **"Project"**
2. Dans la liste des dépôts, sélectionnez **"Gestion-Immo"**
3. Cliquez sur **"Import"**

### 2.3 Configurer le projet

Vercel détecte automatiquement Next.js. Vérifiez ces paramètres :

- **Framework Preset** : Next.js ✅
- **Root Directory** : `./` ✅
- **Build Command** : `npm run build` ✅
- **Output Directory** : `.next` ✅
- **Install Command** : `npm install` ✅

### 2.4 Variables d'environnement

**⚠️ IMPORTANT** : Ajoutez ces variables dans **"Environment Variables"** :

| Variable | Description | Où trouver |
|----------|-------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | Dashboard Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_APP_URL` | URL de production Vercel | À remplir après le 1er déploiement |

**Pour chaque variable** :
1. Cliquez sur **"Add"**
2. Entrez le nom de la variable
3. Entrez la valeur
4. Sélectionnez les environnements : **Production**, **Preview**, **Development**
5. Cliquez sur **"Save"**

### 2.5 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez la fin du build (2-3 minutes)
3. Vercel vous donnera une URL : `https://gestion-immo-xxxxx.vercel.app`

## 🔄 Étape 3 : Configuration post-déploiement

### 3.1 Mettre à jour NEXT_PUBLIC_APP_URL

1. Retournez dans Vercel → **Settings** → **Environment Variables**
2. Modifiez `NEXT_PUBLIC_APP_URL` avec l'URL Vercel (ex: `https://gestion-immo-xxxxx.vercel.app`)
3. Redéployez le projet

### 3.2 Configurer Supabase

1. Allez sur **https://app.supabase.com**
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Authentication** → **URL Configuration**
4. Dans **"Site URL"** : Entrez l'URL Vercel
5. Dans **"Redirect URLs"** : Ajoutez `https://votre-projet.vercel.app/**`
6. Cliquez sur **"Save"**

## ✅ Vérification

Après le déploiement, testez :

- ✅ La page d'accueil charge
- ✅ L'authentification fonctionne (connexion/déconnexion)
- ✅ La création de logement fonctionne
- ✅ Les données se chargent correctement

## 🐛 Résolution de problèmes

### Erreur de build

- Vérifiez les logs dans Vercel → **Deployments** → [votre déploiement] → **Build Logs**
- Vérifiez que toutes les variables d'environnement sont correctes

### Erreurs Supabase

- Vérifiez que les clés API sont correctes
- Vérifiez que l'URL de production est dans les Redirect URLs Supabase

### Variables d'environnement non trouvées

- Vérifiez que les variables sont bien ajoutées dans Vercel
- Vérifiez qu'elles sont sélectionnées pour le bon environnement
- Redéployez après modification

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)

