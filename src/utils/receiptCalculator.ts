/**
 * Système de calcul du reçu détaillé pour CourseMax
 * Calcule automatiquement les prix, taxes, frais de livraison, pourboire et répartition
 */

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptBreakdown {
  items: ReceiptItem[];
  subtotal: number;
  taxes: number;
  deliveryFee: number;
  tip: number;
  totalProducts: number; // subtotal + taxes
  totalFees: number; // deliveryFee + tip
  grandTotal: number;
  merchantAmount: number; // Ce que le merchant reçoit (produits + taxes)
  driverAmount: number; // Ce que le livreur reçoit (frais livraison + pourboire)
  adminCommission: number; // Commission admin (pour l'instant 0)
}

export interface CalculateReceiptParams {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  deliveryFee: number;
  tip: number;
  taxRate?: number; // Taux de taxe par défaut (15% pour Québec)
  adminCommissionRate?: number; // Taux de commission admin (par défaut 0)
  location?: string; // Pour calculer les taxes selon la localisation
}

/**
 * Calcule le taux de taxe selon la localisation
 */
function getTaxRate(location?: string): number {
  // Par défaut, taux de taxe pour Québec (GST + QST = 15%)
  // Vous pouvez ajouter d'autres localisations ici
  if (location?.toLowerCase().includes('quebec') || location?.toLowerCase().includes('qc')) {
    return 0.15; // 15% pour Québec
  }
  // Taux par défaut
  return 0.15;
}

/**
 * Calcule le reçu détaillé avec répartition automatique
 */
export function calculateReceipt(params: CalculateReceiptParams): ReceiptBreakdown {
  const {
    items,
    deliveryFee,
    tip,
    taxRate,
    adminCommissionRate = 0,
    location
  } = params;

  // Calculer le taux de taxe
  const finalTaxRate = taxRate ?? getTaxRate(location);

  // Calculer les items avec totaux
  const receiptItems: ReceiptItem[] = items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.price * item.quantity
  }));

  // Sous-total des produits
  const subtotal = receiptItems.reduce((sum, item) => sum + item.total, 0);

  // Taxes sur les produits uniquement (pas sur livraison ni pourboire)
  const taxes = subtotal * finalTaxRate;

  // Total des produits (sous-total + taxes)
  const totalProducts = subtotal + taxes;

  // Total des frais (livraison + pourboire)
  const totalFees = deliveryFee + tip;

  // Total général
  const grandTotal = totalProducts + totalFees;

  // Répartition:
  // - Merchant reçoit: produits + taxes
  // - Driver reçoit: frais livraison + pourboire
  // - Admin commission: pour l'instant 0 (peut être calculé plus tard)
  const merchantAmount = totalProducts;
  const driverAmount = totalFees;
  const adminCommission = grandTotal * adminCommissionRate;

  return {
    items: receiptItems,
    subtotal,
    taxes,
    deliveryFee,
    tip,
    totalProducts,
    totalFees,
    grandTotal,
    merchantAmount,
    driverAmount,
    adminCommission
  };
}

/**
 * Calcule le pourboire suggéré basé sur le montant
 */
export function calculateSuggestedTip(amount: number): {
  percentage10: number;
  percentage15: number;
  percentage20: number;
} {
  return {
    percentage10: Math.round(amount * 0.1 * 100) / 100,
    percentage15: Math.round(amount * 0.15 * 100) / 100,
    percentage20: Math.round(amount * 0.2 * 100) / 100
  };
}

/**
 * Formate un montant en dollars canadiens
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
}

