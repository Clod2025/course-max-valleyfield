# 🎯 GUIDE DE VALIDATION - Formulaire Compte Bancaire

## ✅ CHAMPS SPÉCIFIQUES AUX COMPTES BANCAIRES AJOUTÉS

### **1. Champs Dynamiques :**
- **Transit** : Input texte, 5 chiffres obligatoires
- **Institution** : Input texte, 3 chiffres obligatoires  
- **Numéro de compte** : Input texte, obligatoire (existant)
- **Banque** : Dropdown avec liste de banques canadiennes (existant)

### **2. Affichage Conditionnel :**
- **Déclencheur** : Sélection de "Compte bancaire" dans le type de paiement
- **Logique** : Champs visibles uniquement si `type === 'bank_account'`
- **Layout** : Transit et Institution côte à côte (grid responsive)

## 🛠️ FONCTIONNALITÉS IMPLÉMENTÉES

### **1. Interface Utilisateur :**
- **Champs dynamiques** : Apparition/disparition selon le type sélectionné
- **Layout responsive** : Grid 2 colonnes sur desktop, 1 colonne sur mobile
- **Labels explicites** : "Transit *", "Institution *", "Banque *"
- **Placeholders** : Exemples clairs (Ex: 12345, Ex: 001)

### **2. Validation Frontend :**
- **Transit** : Exactement 5 chiffres (`/^[0-9]{5}$/`)
- **Institution** : Exactement 3 chiffres (`/^[0-9]{3}$/`)
- **Banque** : Sélection obligatoire
- **Messages d'erreur** : Toast notifications spécifiques

### **3. Affichage dans le Tableau :**
- **Informations bancaires** : Transit et Institution affichés
- **Format** : "Transit: 12345 | Institution: 001"
- **Code bancaire** : "12345-001" sous le nom de la banque

## 🧪 PROCÉDURE DE VALIDATION

### **Étape 1 : Accès au Formulaire**
1. Connectez-vous avec un compte admin
2. Allez sur `/dashboard/admin` → Onglet "Finance"
3. Cliquez sur l'onglet "Moyens de paiement"
4. Cliquez sur "Ajouter un moyen"
5. **Vérification** : Le formulaire s'ouvre

### **Étape 2 : Test de l'Affichage Conditionnel**
1. **Par défaut** : Sélectionnez "Carte de débit"
2. **Vérification** : Seuls les champs généraux sont visibles
3. **Changement** : Sélectionnez "Compte bancaire"
4. **Vérification** : Les champs Transit, Institution et Banque apparaissent
5. **Retour** : Sélectionnez "Interac"
6. **Vérification** : Les champs bancaires disparaissent

### **Étape 3 : Test de Validation**
1. Sélectionnez "Compte bancaire"
2. **Test Transit** :
   - Laissez vide → Erreur "Le transit doit contenir exactement 5 chiffres"
   - Entrez "123" → Erreur (pas 5 chiffres)
   - Entrez "12345" → OK
3. **Test Institution** :
   - Laissez vide → Erreur "L'institution doit contenir exactement 3 chiffres"
   - Entrez "12" → Erreur (pas 3 chiffres)
   - Entrez "001" → OK
4. **Test Banque** :
   - Laissez vide → Erreur "Veuillez sélectionner une banque"
   - Sélectionnez une banque → OK

### **Étape 4 : Test de Sauvegarde**
1. Remplissez le formulaire complet :
   - **Type** : Compte bancaire
   - **Nom** : Compte RBC Principal
   - **Titulaire** : CourseMax Inc.
   - **Numéro** : 1234567890
   - **Banque** : Banque Royale du Canada (RBC)
   - **Transit** : 12345
   - **Institution** : 001
2. Cliquez sur "Ajouter"
3. **Vérification** : Notification de succès
4. **Vérification** : Le moyen de paiement apparaît dans le tableau
5. **Vérification** : Les informations bancaires sont affichées

### **Étape 5 : Test de l'Affichage dans le Tableau**
1. **Vérification** : Le compte bancaire apparaît dans la liste
2. **Vérification** : Colonne "Compte" affiche :
   - Numéro masqué (****7890)
   - "Transit: 12345 | Institution: 001"
3. **Vérification** : Colonne "Banque" affiche :
   - Nom de la banque
   - Code bancaire "12345-001"

## 🔧 STRUCTURE TECHNIQUE

### **1. Interface PaymentMethod :**
```typescript
interface PaymentMethod {
  id: string;
  type: 'debit_card' | 'bank_account' | 'interac';
  name: string;
  holder_name: string;
  account_number: string;
  bank_name?: string;
  transit?: string;        // Nouveau champ
  institution?: string;    // Nouveau champ
  is_default: boolean;
  created_at: string;
}
```

### **2. État du Formulaire :**
```typescript
const [paymentMethodForm, setPaymentMethodForm] = useState({
  type: 'debit_card',
  name: '',
  holder_name: '',
  account_number: '',
  bank_name: '',
  transit: '',           // Nouveau champ
  institution: '',       // Nouveau champ
  is_default: false
});
```

### **3. Validation Frontend :**
```typescript
// Validation spécifique pour les comptes bancaires
if (paymentMethodForm.type === 'bank_account') {
  // Validation du transit (5 chiffres)
  if (!paymentMethodForm.transit || !/^[0-9]{5}$/.test(paymentMethodForm.transit)) {
    toast({ title: "Erreur", description: "Le transit doit contenir exactement 5 chiffres" });
    return;
  }

  // Validation de l'institution (3 chiffres)
  if (!paymentMethodForm.institution || !/^[0-9]{3}$/.test(paymentMethodForm.institution)) {
    toast({ title: "Erreur", description: "L'institution doit contenir exactement 3 chiffres" });
    return;
  }

  // Validation de la banque
  if (!paymentMethodForm.bank_name) {
    toast({ title: "Erreur", description: "Veuillez sélectionner une banque" });
    return;
  }
}
```

### **4. Affichage Conditionnel :**
```tsx
{paymentMethodForm.type === 'bank_account' && (
  <>
    <div>
      <Label htmlFor="bank_name">Banque *</Label>
      <Select value={paymentMethodForm.bank_name} onValueChange={...}>
        {/* Liste des banques canadiennes */}
      </Select>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="transit">Transit *</Label>
        <Input
          id="transit"
          value={paymentMethodForm.transit}
          onChange={...}
          placeholder="Ex: 12345"
          maxLength={5}
          pattern="[0-9]{5}"
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          5 chiffres (ex: 12345)
        </p>
      </div>
      
      <div>
        <Label htmlFor="institution">Institution *</Label>
        <Input
          id="institution"
          value={paymentMethodForm.institution}
          onChange={...}
          placeholder="Ex: 001"
          maxLength={3}
          pattern="[0-9]{3}"
          required
        />
        <p className="text-sm text-muted-foreground mt-1">
          3 chiffres (ex: 001)
        </p>
      </div>
    </div>
  </>
)}
```

## 📊 RÉSULTATS ATTENDUS

### **✅ Affichage Conditionnel :**
- [ ] **Champs cachés** : Transit et Institution non visibles pour "Carte de débit"
- [ ] **Champs visibles** : Transit et Institution visibles pour "Compte bancaire"
- [ ] **Layout responsive** : Grid 2 colonnes sur desktop, 1 colonne sur mobile
- [ ] **Labels clairs** : "Transit *", "Institution *", "Banque *"

### **✅ Validation Frontend :**
- [ ] **Transit** : Validation 5 chiffres exactement
- [ ] **Institution** : Validation 3 chiffres exactement
- [ ] **Banque** : Sélection obligatoire
- [ ] **Messages d'erreur** : Toast notifications spécifiques
- [ ] **Pattern HTML** : `pattern="[0-9]{5}"` et `pattern="[0-9]{3}"`

### **✅ Sauvegarde :**
- [ ] **Données complètes** : Transit et Institution sauvegardés
- [ ] **Validation** : Erreurs affichées avant sauvegarde
- [ ] **Succès** : Notification de succès après sauvegarde
- [ ] **Réinitialisation** : Formulaire vidé après succès

### **✅ Affichage dans le Tableau :**
- [ ] **Informations bancaires** : Transit et Institution affichés
- [ ] **Format** : "Transit: 12345 | Institution: 001"
- [ ] **Code bancaire** : "12345-001" sous le nom de la banque
- [ ] **Masquage** : Numéro de compte masqué (****7890)

### **✅ Qualité Technique :**
- [ ] **Build réussi** : `npm run build` passe sans erreur
- [ ] **Dev server** : `npm run dev` démarre correctement
- [ ] **Aucun warning** : Console propre
- [ ] **Code propre** : Structure maintenue pour autres types

## 🚀 COMMANDES DE VALIDATION

### **Build et Dev :**
```bash
npm run build  # Doit passer sans erreur
npm run dev    # Doit démarrer sans erreur
```

### **Test de l'Interface :**
1. **URL Admin** : `http://localhost:5173/dashboard/admin`
2. **Finance** : Onglet "Finance"
3. **Moyens de paiement** : Onglet "Moyens de paiement"
4. **Ajouter** : Bouton "Ajouter un moyen"

### **Test des Champs :**
1. **Sélection** : "Compte bancaire" dans le type
2. **Champs** : Transit, Institution, Banque visibles
3. **Validation** : Test des formats et champs obligatoires
4. **Sauvegarde** : Test de l'ajout avec données complètes

## 📝 EXEMPLES D'UTILISATION

### **1. Compte Bancaire Complet :**
- **Type** : Compte bancaire
- **Nom** : Compte RBC Principal
- **Titulaire** : CourseMax Inc.
- **Numéro** : 1234567890
- **Banque** : Banque Royale du Canada (RBC)
- **Transit** : 12345
- **Institution** : 001

### **2. Validation des Erreurs :**
- **Transit vide** : "Le transit doit contenir exactement 5 chiffres"
- **Transit incorrect** : "123" → Erreur (pas 5 chiffres)
- **Institution vide** : "L'institution doit contenir exactement 3 chiffres"
- **Banque vide** : "Veuillez sélectionner une banque"

### **3. Affichage dans le Tableau :**
- **Compte** : "****7890" + "Transit: 12345 | Institution: 001"
- **Banque** : "Banque Royale du Canada (RBC)" + "12345-001"

## 🎯 INSTRUCTIONS DE TEST COMPLET

### **Test 1 : Affichage Conditionnel**
1. Ouvrez le formulaire d'ajout
2. **Vérification** : Seuls les champs généraux sont visibles
3. Sélectionnez "Compte bancaire"
4. **Vérification** : Transit, Institution et Banque apparaissent
5. Sélectionnez "Interac"
6. **Vérification** : Les champs bancaires disparaissent

### **Test 2 : Validation des Champs**
1. Sélectionnez "Compte bancaire"
2. Testez chaque champ :
   - Transit : vide, "123", "12345"
   - Institution : vide, "12", "001"
   - Banque : vide, sélection
3. **Vérification** : Messages d'erreur appropriés

### **Test 3 : Sauvegarde Complète**
1. Remplissez tous les champs correctement
2. Cliquez sur "Ajouter"
3. **Vérification** : Notification de succès
4. **Vérification** : Apparition dans le tableau
5. **Vérification** : Informations bancaires affichées

### **Test 4 : Affichage dans le Tableau**
1. Vérifiez l'affichage du compte bancaire
2. **Vérification** : Numéro masqué (****7890)
3. **Vérification** : "Transit: 12345 | Institution: 001"
4. **Vérification** : Code bancaire "12345-001"

## 📋 NOTES IMPORTANTES

1. **Champs conditionnels** : Visibles uniquement pour "Compte bancaire"
2. **Validation stricte** : Transit 5 chiffres, Institution 3 chiffres
3. **Layout responsive** : Grid 2 colonnes sur desktop
4. **Affichage enrichi** : Informations bancaires dans le tableau
5. **Structure maintenue** : Autres types de paiement non affectés

Le formulaire de compte bancaire est maintenant **entièrement fonctionnel** avec validation et affichage conditionnel ! 🚀
