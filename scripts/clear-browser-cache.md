# Instructions pour vider le cache du navigateur

## Problème
Le navigateur peut mettre en cache l'ancien HTML qui contient des chemins incorrects pour les fichiers statiques (`/next/static/` au lieu de `/_next/static/`).

## Solutions

### Solution 1 : Hard Refresh (Recommandé)
1. Ouvrir Chrome avec la page `localhost:3000`
2. Appuyer sur **`Cmd + Shift + R`** (Mac) ou **`Ctrl + Shift + R`** (Windows/Linux)
3. Ou clic droit sur le bouton de rafraîchissement → "Vider le cache et effectuer une actualisation forcée"

### Solution 2 : Via DevTools
1. Ouvrir les DevTools (F12 ou `Cmd + Option + I`)
2. Aller dans l'onglet **Network**
3. Cocher **"Disable cache"** en haut à gauche
4. Garder les DevTools ouverts
5. Recharger la page (`Cmd + R` ou `F5`)

### Solution 3 : Vider tout le cache Chrome
1. Appuyer sur **`Cmd + Shift + Delete`** (Mac) ou **`Ctrl + Shift + Delete`** (Windows)
2. Sélectionner **"Images et fichiers en cache"**
3. Période : **"Toutes les périodes"**
4. Cliquer sur **"Effacer les données"**
5. Recharger `localhost:3000`

### Solution 4 : Navigation privée (Test rapide)
1. Ouvrir une fenêtre de navigation privée (`Cmd + Shift + N`)
2. Aller sur `http://localhost:3000`
3. Si ça fonctionne, c'est bien un problème de cache

## Vérification
Après avoir vidé le cache, dans la console DevTools, vous devriez voir :
- ✅ Les chemins avec `/_next/static/` (avec underscore)
- ✅ Plus d'erreurs 404

## Note
Le serveur génère maintenant les bons chemins. Le problème vient uniquement du cache du navigateur.






