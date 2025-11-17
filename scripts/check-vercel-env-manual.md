# 🔍 Vérification manuelle des variables Vercel

Puisque Vercel CLI n'est pas installé, voici comment vérifier manuellement les variables d'environnement sur Vercel.

## 📋 Étapes pour vérifier les variables sur Vercel

### 1. Accéder au Dashboard Vercel

1. Allez sur https://vercel.com/dashboard
2. Connectez-vous à votre compte
3. Sélectionnez le projet `gestion-immo-nine` (ou le nom de votre projet)

### 2. Vérifier les variables d'environnement

1. Dans votre projet, allez dans **Settings** → **Environment Variables**
2. Vérifiez que les variables suivantes sont configurées :

#### Variables obligatoires :

- ✅ **`NEXT_PUBLIC_SUPABASE_URL`**
  - Valeur attendue : `https://poeijjosocmqlhgsacud.supabase.co`
  - ⚠️ **IMPORTANT** : Ne doit PAS être l'URL du dashboard (`https://supabase.com/dashboard/...`)
  - Environnements : Production, Preview, Development

- ✅ **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
  - Valeur : Votre clé anonyme publique Supabase
  - Où trouver : Supabase Dashboard → Settings → API → anon public key
  - Environnements : Production, Preview, Development

- ✅ **`SUPABASE_SERVICE_ROLE_KEY`**
  - Valeur : Votre clé de service Supabase (privée)
  - Où trouver : Supabase Dashboard → Settings → API → service_role key
  - ⚠️ **IMPORTANT** : Ne jamais exposer côté client
  - Environnements : Production, Preview, Development

#### Variable recommandée :

- ⭐ **`NEXT_PUBLIC_APP_URL`**
  - Valeur attendue : `https://gestion-immo-nine.vercel.app`
  - ⚠️ **IMPORTANT** : Sans slash final (`/`)
  - Utilisée pour les redirections d'email (confirmation, reset password)
  - Environnements : Production (obligatoire), Preview (optionnel), Development (optionnel)

### 3. Ajouter/modifier une variable

1. Cliquez sur **Add New** ou modifiez une variable existante
2. Entrez le nom de la variable (ex: `NEXT_PUBLIC_APP_URL`)
3. Entrez la valeur (ex: `https://gestion-immo-nine.vercel.app`)
4. Sélectionnez les environnements (Production, Preview, Development)
5. Cliquez sur **Save**

### 4. Redéployer après modification

Après avoir ajouté ou modifié une variable :

1. Allez dans **Deployments**
2. Trouvez le dernier déploiement
3. Cliquez sur les **3 points** (⋯) → **Redeploy**
4. Ou poussez un nouveau commit pour déclencher un nouveau déploiement

## ✅ Checklist de vérification

- [ ] `NEXT_PUBLIC_SUPABASE_URL` est configurée et pointe vers l'API (pas le dashboard)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` est configurée
- [ ] `SUPABASE_SERVICE_ROLE_KEY` est configurée
- [ ] `NEXT_PUBLIC_APP_URL` est configurée avec `https://gestion-immo-nine.vercel.app`
- [ ] Toutes les variables sont configurées pour au moins l'environnement **Production**
- [ ] Un redéploiement a été effectué après les modifications

## 🐛 Problèmes courants

### Les emails redirigent vers localhost

**Cause** : `NEXT_PUBLIC_APP_URL` n'est pas configurée ou incorrecte

**Solution** :
1. Vérifier que `NEXT_PUBLIC_APP_URL` = `https://gestion-immo-nine.vercel.app` (sans slash final)
2. Redéployer l'application

### Erreur "Invalid login credentials"

**Cause** : Email non normalisé ou variables Supabase incorrectes

**Solution** :
1. Vérifier que les emails dans Supabase sont en minuscules (déjà fait ✅)
2. Vérifier que `NEXT_PUBLIC_SUPABASE_URL` pointe vers l'API correcte
3. Vérifier que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est correcte

### Erreur 500 lors de la connexion

**Cause** : Variables d'environnement manquantes ou incorrectes

**Solution** :
1. Vérifier toutes les variables dans Vercel
2. Vérifier les logs Vercel pour plus de détails
3. Redéployer après correction

