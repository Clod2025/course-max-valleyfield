# 💳 Système de Paiement CourseMax

## 📋 Vue d'ensemble

Le système de paiement CourseMax permet aux clients de payer leurs commandes via deux méthodes principales :
- **Carte de débit/crédit** : Paiement instantané sécurisé
- **Interac e-Transfer** : Transfert bancaire avec vérification manuelle

## 🏗️ Architecture

```
src/components/payment/
├── PaymentMethodSelector.tsx    # Sélection de la méthode de paiement
├── CardPayment.tsx              # Paiement par carte
├── InteracPayment.tsx           # Paiement Interac
├── ProofUpload.tsx             # Upload de preuve de transaction
├── __tests__/                   # Tests unitaires
└── README.md                    # Cette documentation
```

## 🔧 Composants

### 1. PaymentMethodSelector

**Rôle :** Interface de sélection des méthodes de paiement

**Props :**
```typescript
interface PaymentMethodSelectorProps {
  amount: number;
  merchantInfo: {
    id: string;
    name: string;
    hasInterac: boolean;
    interacEmail?: string;
    interacPhone?: string;
  };
  onMethodSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod | null;
  className?: string;
}
```

**Fonctionnalités :**
- Affichage des méthodes disponibles
- Calcul automatique des frais (3% pour carte, 0% pour Interac)
- Validation de la disponibilité Interac
- Interface responsive

### 2. CardPayment

**Rôle :** Formulaire de paiement par carte sécurisé

**Props :**
```typescript
interface CardPaymentProps {
  amount: number;
  merchantInfo: {
    id: string;
    name: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  onBack: () => void;
  className?: string;
}
```

**Fonctionnalités :**
- Validation en temps réel des champs
- Formatage automatique du numéro de carte
- Masquage du CVV
- Gestion des erreurs de paiement
- Conformité PCI DSS

**Validation :**
- Numéro de carte : 13-19 chiffres
- Date d'expiration : Format MM/AA, non expirée
- CVV : 3-4 chiffres
- Nom : Minimum 2 caractères

### 3. InteracPayment

**Rôle :** Interface de paiement Interac e-Transfer

**Props :**
```typescript
interface InteracPaymentProps {
  amount: number;
  orderId: string;
  merchantInteracInfo: {
    email: string;
    phone: string;
    businessName: string;
  };
  onProofUploaded: (proofData: any) => void;
  onBack: () => void;
  className?: string;
}
```

**Fonctionnalités :**
- Affichage des informations marchand
- Copie automatique des informations
- Upload de preuve de transaction
- Instructions claires pour le client

### 4. ProofUpload

**Rôle :** Système d'upload de preuves de transaction

**Props :**
```typescript
interface ProofUploadProps {
  orderId: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // en MB
  allowedTypes?: string[];
  className?: string;
}
```

**Fonctionnalités :**
- Drag & drop interface
- Validation des fichiers (taille, format)
- Aperçu des fichiers
- Compression automatique
- Support multi-fichiers

**Formats supportés :**
- Images : JPG, PNG
- Documents : PDF
- Taille max : 5MB par fichier

## 🗄️ Base de données

### Tables requises

```sql
-- Ajout des colonnes Interac aux marchands
ALTER TABLE merchants ADD COLUMN interac_email VARCHAR(255);
ALTER TABLE merchants ADD COLUMN interac_phone VARCHAR(20);
ALTER TABLE merchants ADD COLUMN interac_enabled BOOLEAN DEFAULT FALSE;

-- Table des preuves Interac
CREATE TABLE interac_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  merchant_id UUID REFERENCES merchants(id),
  file_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_by_merchant BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Statuts de commande Interac
ALTER TYPE order_status ADD VALUE 'pending_interac_verification';
ALTER TYPE order_status ADD VALUE 'interac_verified';
ALTER TYPE order_status ADD VALUE 'interac_rejected';
```

## 🔄 Flux de données

### Paiement par carte
1. Client sélectionne "Carte"
2. Remplit le formulaire sécurisé
3. Validation côté client
4. Appel API de paiement (Stripe/Square)
5. Confirmation de transaction
6. Commande créée avec statut "confirmed"

### Paiement Interac
1. Client sélectionne "Interac"
2. Affichage des informations marchand
3. Client effectue le transfert
4. Upload de la preuve de transaction
5. Commande créée avec statut "pending_interac_verification"
6. Notification au marchand
7. Vérification manuelle par le marchand
8. Statut mis à jour : "interac_verified" ou "interac_rejected"

## 🛡️ Sécurité

### Mesures implémentées
- **Chiffrement** : Toutes les données sensibles sont chiffrées
- **Validation** : Double validation côté client et serveur
- **Tokenisation** : Les données de carte sont tokenisées
- **Audit trail** : Logs complets de toutes les transactions
- **Rate limiting** : Protection contre les attaques par force brute

### Conformité
- **PCI DSS** : Pour les paiements par carte
- **RGPD** : Protection des données personnelles
- **Standards bancaires** : Pour les transferts Interac

## 🧪 Tests

### Tests unitaires
```bash
npm test src/components/payment/__tests__/PaymentSystem.test.tsx
```

### Tests d'intégration
- Test du flux complet de paiement
- Test des validations
- Test de la gestion d'erreurs
- Test de performance

### Tests de sécurité
- Test de validation des données
- Test de protection contre les injections
- Test de conformité PCI DSS

## 📊 Monitoring

### Métriques à suivre
- **Taux de réussite** : % de paiements réussis
- **Temps de traitement** : Durée moyenne des transactions
- **Taux d'abandon** : % de clients qui abandonnent le checkout
- **Volume par méthode** : Répartition carte vs Interac

### Alertes
- Échecs de paiement > 5%
- Temps de traitement > 30s
- Erreurs de validation > 10%

## 🚀 Déploiement

### Prérequis
- [ ] Passerelle de paiement configurée (Stripe/Square)
- [ ] Webhooks configurés et testés
- [ ] Stockage de fichiers sécurisé
- [ ] Certificats SSL valides
- [ ] Base de données migrée

### Checklist de déploiement
- [ ] Tests E2E passés
- [ ] Monitoring configuré
- [ ] Backup automatique
- [ ] Documentation mise à jour
- [ ] Formation équipe

## 🔧 Configuration

### Variables d'environnement
```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Upload
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# Sécurité
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret
```

### Configuration Supabase
```typescript
// RLS Policies pour les preuves Interac
CREATE POLICY "Merchants can view their interac proofs" ON interac_proofs
  FOR SELECT USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE owner_id = auth.uid()
    )
  );
```

## 📞 Support

### Problèmes courants
1. **Carte refusée** : Vérifier les informations, contacter la banque
2. **Upload échoué** : Vérifier la taille et le format du fichier
3. **Interac non reçu** : Vérifier les informations marchand

### Contact
- **Support technique** : support@coursemax.com
- **Urgences** : +1 (450) 123-4567
- **Documentation** : docs.coursemax.com

## 📈 Roadmap

### Version 1.1
- [ ] Paiement Apple Pay / Google Pay
- [ ] Paiement en plusieurs fois
- [ ] Remboursements automatiques

### Version 1.2
- [ ] Cryptomonnaies
- [ ] Paiement par virement bancaire
- [ ] API publique pour intégrations

---

**Dernière mise à jour :** 28 janvier 2024  
**Version :** 1.0.0  
**Auteur :** Équipe CourseMax
