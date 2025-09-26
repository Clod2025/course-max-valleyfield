# 🎯 GUIDE DE VALIDATION - Gestion des Réseaux Sociaux

## ✅ SECTION RÉSEAUX SOCIAUX AJOUTÉE AU FOOTER

### **1. Section "Suivez-nous" dans le Footer :**
- **Emplacement** : Footer principal, après la section de contact
- **Titre** : "Suivez-nous"
- **Affichage** : Icônes + noms des plateformes + liens externes
- **Design** : Cartes avec hover effects et icônes colorées

### **2. Plateformes Supportées :**
- **Facebook** : Icône Facebook + lien vers la page
- **Instagram** : Icône Instagram + lien vers le profil
- **Twitter/X** : Icône Twitter + lien vers le compte
- **LinkedIn** : Icône LinkedIn + lien vers le profil
- **YouTube** : Icône YouTube + lien vers la chaîne
- **TikTok** : Icône générique + lien vers le profil

## 🛠️ FORMULAIRE DE GESTION DES RÉSEAUX SOCIAUX

### **1. Interface Admin Intégrée :**
- **Emplacement** : Admin → Paramètres → Réseaux sociaux
- **Composant** : `src/components/admin/SocialMediaManager.tsx`
- **Navigation** : Nouvel onglet "Réseaux sociaux" dans les paramètres

### **2. Fonctionnalités CRUD Complètes :**

#### **A) Ajouter un Réseau Social :**
- **Sélection** : Dropdown avec 6 plateformes (Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok)
- **URL** : Champ de saisie avec validation d'URL
- **Statut** : Actif/Inactif (visible dans le footer)
- **Validation** : URL valide obligatoire

#### **B) Modifier un Réseau Social :**
- **Édition** : Clic sur l'icône "Éditer"
- **Formulaire** : Même interface que l'ajout
- **Sauvegarde** : Mise à jour en temps réel

#### **C) Supprimer un Réseau Social :**
- **Suppression** : Clic sur l'icône "Supprimer"
- **Confirmation** : Suppression immédiate
- **Mise à jour** : Disparition du footer

### **3. Interface Professionnelle :**
- **Tableau** : Colonnes (Plateforme, URL, Statut, Actions)
- **Icônes** : Correspondance avec les plateformes
- **Actions** : Boutons Éditer/Supprimer
- **Statuts** : Badges Actif/Inactif
- **Liens externes** : Ouverture dans un nouvel onglet

## 🧪 PROCÉDURE DE VALIDATION

### **Étape 1 : Accès à la Gestion des Réseaux Sociaux**
1. Connectez-vous avec un compte admin
2. Allez sur `/dashboard/admin`
3. Cliquez sur l'onglet "Paramètres"
4. Cliquez sur l'onglet "Réseaux sociaux"
5. **Vérification** : L'interface de gestion s'affiche

### **Étape 2 : Test d'Ajout d'un Réseau Social**
1. Cliquez sur "Ajouter un réseau"
2. Remplissez le formulaire :
   - **Plateforme** : `Facebook`
   - **URL** : `https://facebook.com/coursemax`
   - **Statut** : Actif (coché)
3. Cliquez sur "Ajouter"
4. **Vérification** : Notification de succès
5. **Vérification** : Le réseau apparaît dans le tableau

### **Étape 3 : Test de Modification**
1. Cliquez sur l'icône "Éditer" d'un réseau existant
2. Modifiez l'URL : `https://facebook.com/coursemaxvalleyfield`
3. Cliquez sur "Sauvegarder"
4. **Vérification** : La modification est visible dans le tableau

### **Étape 4 : Test de Suppression**
1. Cliquez sur l'icône "Supprimer" d'un réseau
2. Confirmez la suppression
3. **Vérification** : Le réseau disparaît du tableau

### **Étape 5 : Vérification du Footer**
1. Allez sur la page d'accueil du site
2. **Vérification** : La section "Suivez-nous" s'affiche
3. **Vérification** : Les réseaux sociaux configurés sont visibles
4. **Vérification** : Les liens fonctionnent (ouverture dans un nouvel onglet)
5. **Vérification** : Les icônes correspondent aux plateformes

## 🔧 STRUCTURE TECHNIQUE

### **1. Hook de Gestion des Données :**
```typescript
// src/hooks/useSocialMedia.tsx
interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSocialMedia = () => {
  const [socialMedias, setSocialMedias] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fonctions de gestion...
};
```

### **2. Composant de Gestion Admin :**
```typescript
// src/components/admin/SocialMediaManager.tsx
export const SocialMediaManager: React.FC = () => {
  // États et fonctions de gestion
  const [socialMedias, setSocialMedias] = useState<SocialMedia[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Fonctions CRUD
  const addSocialMedia = async () => { /* ... */ };
  const updateSocialMedia = async () => { /* ... */ };
  const deleteSocialMedia = async () => { /* ... */ };
};
```

### **3. Section Footer :**
```typescript
// src/components/AppFooter.tsx
const SocialMediaSection: React.FC = () => {
  const { socialMedias, loading } = useSocialMedia();
  
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      // ... autres plateformes
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-3">Suivez-nous</h3>
      <div className="flex flex-wrap gap-3">
        {socialMedias.map((social) => (
          <a href={social.url} target="_blank" rel="noopener noreferrer">
            {getSocialIcon(social.platform)}
            <span>{social.platform}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
```

## 📊 RÉSULTATS ATTENDUS

### **✅ Interface de Gestion Fonctionnelle :**
- [ ] **Accès via Paramètres** : Onglet "Réseaux sociaux" accessible
- [ ] **Tableau complet** : Tous les réseaux sociaux listés
- [ ] **Ajout de réseau** : Formulaire fonctionnel
- [ ] **Modification** : Édition des réseaux existants
- [ ] **Suppression** : Suppression des réseaux
- [ ] **Validation** : URLs valides obligatoires

### **✅ Section Footer :**
- [ ] **Affichage automatique** : Réseaux sociaux visibles
- [ ] **Icônes correctes** : Correspondance avec les plateformes
- [ ] **Liens fonctionnels** : Ouverture dans un nouvel onglet
- [ ] **Design responsive** : Adaptation mobile/desktop
- [ ] **Mise à jour temps réel** : Changements visibles immédiatement

### **✅ Opérations CRUD :**
- [ ] **Create** : Ajout de réseaux sociaux
- [ ] **Read** : Affichage des données
- [ ] **Update** : Modification des réseaux
- [ ] **Delete** : Suppression des réseaux
- [ ] **Validation** : Champs obligatoires et format URL

### **✅ Qualité Technique :**
- [ ] **Build réussi** : `npm run build` passe sans erreur
- [ ] **Dev server** : `npm run dev` démarre correctement
- [ ] **Aucun warning** : Console propre
- [ ] **Code propre** : Imports optimisés, structure claire

## 🚀 COMMANDES DE VALIDATION

### **Build et Dev :**
```bash
npm run build  # Doit passer sans erreur
npm run dev    # Doit démarrer sans erreur
```

### **Test de l'Interface Admin :**
1. **URL Admin** : `http://localhost:5173/dashboard/admin`
2. **Paramètres** : Onglet "Paramètres"
3. **Réseaux sociaux** : Onglet "Réseaux sociaux"
4. **Gestion** : Ajout, modification, suppression de réseaux

### **Test du Footer :**
1. **Page d'accueil** : `http://localhost:5173/`
2. **Vérification** : Section "Suivez-nous" visible
3. **Vérification** : Réseaux sociaux configurés affichés
4. **Vérification** : Liens fonctionnels

## 📝 EXEMPLES D'UTILISATION

### **1. Ajout d'un Compte Facebook :**
- **Plateforme** : Facebook
- **URL** : `https://facebook.com/coursemax`
- **Statut** : Actif
- **Résultat** : Icône Facebook + lien dans le footer

### **2. Ajout d'un Profil Instagram :**
- **Plateforme** : Instagram
- **URL** : `https://instagram.com/coursemax`
- **Statut** : Actif
- **Résultat** : Icône Instagram + lien dans le footer

### **3. Ajout d'une Chaîne YouTube :**
- **Plateforme** : YouTube
- **URL** : `https://youtube.com/@coursemax`
- **Statut** : Actif
- **Résultat** : Icône YouTube + lien dans le footer

### **4. Ajout d'un Compte LinkedIn :**
- **Plateforme** : LinkedIn
- **URL** : `https://linkedin.com/company/coursemax`
- **Statut** : Actif
- **Résultat** : Icône LinkedIn + lien dans le footer

## 🎯 INSTRUCTIONS DE TEST COMPLET

### **Test 1 : Gestion des Réseaux Sociaux**
1. Allez dans Admin → Paramètres → Réseaux sociaux
2. Ajoutez 3 réseaux sociaux :
   - Facebook : `https://facebook.com/coursemax`
   - Instagram : `https://instagram.com/coursemax`
   - YouTube : `https://youtube.com/@coursemax`
3. **Vérification** : Les 3 apparaissent dans le tableau

### **Test 2 : Modification d'un Réseau**
1. Modifiez l'URL Facebook : `https://facebook.com/coursemaxvalleyfield`
2. **Vérification** : La modification est visible dans le tableau

### **Test 3 : Suppression d'un Réseau**
1. Supprimez le réseau YouTube
2. **Vérification** : Le réseau disparaît du tableau

### **Test 4 : Vérification du Footer**
1. Allez sur la page d'accueil
2. **Vérification** : La section "Suivez-nous" s'affiche
3. **Vérification** : Facebook et Instagram sont visibles
4. **Vérification** : YouTube n'est plus visible
5. **Vérification** : Les liens fonctionnent

## 📋 NOTES IMPORTANTES

1. **Mock data** : Les données sont simulées pour la démonstration
2. **Plateformes supportées** : 6 réseaux sociaux principaux
3. **Validation URL** : Vérification du format des URLs
4. **Mise à jour temps réel** : Changements visibles immédiatement
5. **Responsive** : Interface adaptée mobile/desktop

La gestion des réseaux sociaux est maintenant **entièrement fonctionnelle** avec une interface professionnelle et une intégration complète dans le footer ! 🚀
