# Configuration des clés API pour la recherche d'images

## Clés API requises

Pour que la fonctionnalité de recherche d'images fonctionne, vous devez configurer les clés API suivantes dans votre fichier `.env.local` :

### 1. Pexels API (Recommandé)
- **URL**: https://www.pexels.com/api/
- **Limite**: 200 requêtes/heure (gratuit)
- **Variable d'environnement**: `PEXELS_API_KEY`

### 2. Unsplash API (Optionnel)
- **URL**: https://unsplash.com/developers
- **Limite**: 50 requêtes/heure (gratuit)
- **Variable d'environnement**: `UNSPLASH_ACCESS_KEY`

## Configuration

Ajoutez ces variables à votre fichier `.env.local` :

```env
# Clés API pour la recherche d'images
PEXELS_API_KEY=your_pexels_api_key_here
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

## Fonctionnement

1. **Priorité**: L'API Pexels est utilisée en premier
2. **Fallback**: Si Pexels ne retourne pas assez d'images, Unsplash est utilisé
3. **Placeholder**: Si aucune API ne fonctionne, des images placeholder sont générées

## Mode démonstration

Si aucune clé API n'est configurée, le système fonctionne en mode démonstration avec des images placeholder automatiques.

## Sécurité

- Ne jamais commiter les clés API dans le code source
- Utiliser des variables d'environnement
- Limiter les permissions des clés API
