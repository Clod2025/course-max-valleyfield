import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ReceiptBreakdown } from '@/utils/receiptCalculator';
import { formatCurrency } from '@/utils/receiptCalculator';
import { Receipt } from 'lucide-react';

interface ReceiptSummaryProps {
  receipt: ReceiptBreakdown;
  className?: string;
}

export const ReceiptSummary: React.FC<ReceiptSummaryProps> = ({ receipt, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Reçu détaillé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des produits */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Produits
          </h4>
          <div className="space-y-2">
            {receipt.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.price)}
                  </div>
                </div>
                <div className="font-medium ml-4">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Détails financiers */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total produits</span>
            <span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxes (TPS/TVQ)</span>
            <span>{formatCurrency(receipt.taxes)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span>{formatCurrency(receipt.deliveryFee)}</span>
          </div>

          {receipt.tip > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pourboire</span>
              <span className="text-green-600 font-medium">
                {formatCurrency(receipt.tip)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-lg font-bold pt-2">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(receipt.grandTotal)}</span>
          </div>
        </div>

        {/* Répartition (pour information uniquement - optionnel) */}
        <div className="mt-4 pt-4 border-t border-dashed space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>→ Marchand reçoit:</span>
            <span>{formatCurrency(receipt.merchantAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>→ Livreur reçoit:</span>
            <span>{formatCurrency(receipt.driverAmount)}</span>
          </div>
          {receipt.adminCommission > 0 && (
            <div className="flex justify-between">
              <span>→ Commission plateforme:</span>
              <span>{formatCurrency(receipt.adminCommission)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

