import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  Gift, 
  DollarSign, 
  Info,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { useLoyalty } from '@/hooks/useLoyalty';
import LoyaltyRedeem from '@/components/loyalty/LoyaltyRedeem';
import { cn } from '@/lib/utils';

interface LoyaltyCheckoutProps {
  orderTotal: number;
  onLoyaltyDiscount: (points: number, discount: number) => void;
  onRemoveLoyaltyDiscount: () => void;
  className?: string;
}

export const LoyaltyCheckout: React.FC<LoyaltyCheckoutProps> = ({
  orderTotal,
  onLoyaltyDiscount,
  onRemoveLoyaltyDiscount,
  className
}) => {
  const { account, loading, calculatePointsValue, calculateMaxRedeemablePoints } = useLoyalty();
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    points: number;
    discount: number;
  } | null>(null);

  const handleRedeem = (points: number, discount: number) => {
    setAppliedDiscount({ points, discount });
    onLoyaltyDiscount(points, discount);
    setShowRedeemModal(false);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    onRemoveLoyaltyDiscount();
  };

  const maxRedeemablePoints = calculateMaxRedeemablePoints(orderTotal);
  const canUseLoyalty = account && 
    account.settings.loyalty_enabled && 
    account.points >= account.settings.min_redemption_points &&
    maxRedeemablePoints > 0;

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!account || !account.settings.loyalty_enabled) {
    return null; // Ne pas afficher si le système est désactivé
  }

  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            Points de Fidélité
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Points disponibles */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold">Vos points</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {account.points.toLocaleString()}
                </p>
              </div>
            </div>
            <Badge className="bg-yellow-600">
              = {calculatePointsValue(account.points).toFixed(2)}$
            </Badge>
          </div>

          {/* Réduction appliquée */}
          {appliedDiscount ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      Réduction appliquée
                    </p>
                    <p className="text-sm text-green-600">
                      {appliedDiscount.points.toLocaleString()} points utilisés
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    -{appliedDiscount.discount.toFixed(2)}$
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveDiscount}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Bouton pour utiliser les points */
            canUseLoyalty ? (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowRedeemModal(true)}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Utiliser mes points
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Jusqu'à {maxRedeemablePoints.toLocaleString()} points utilisables
                  </p>
                  <p className="text-xs text-muted-foreground">
                    = {calculatePointsValue(maxRedeemablePoints).toFixed(2)}$ de réduction
                  </p>
                </div>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {account.points < account.settings.min_redemption_points ? (
                    <>
                      <p>Points insuffisants pour échanger</p>
                      <p className="text-sm">
                        Minimum {account.settings.min_redemption_points} points requis
                      </p>
                    </>
                  ) : (
                    <p>Points non disponibles pour cette commande</p>
                  )}
                </AlertDescription>
              </Alert>
            )
          )}

          {/* Informations sur le système */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 1$ dépensé = {account.settings.loyalty_earn_rate} point</p>
            <p>• 1 point = {account.settings.loyalty_redeem_rate}$ de réduction</p>
            <p>• Minimum {account.settings.min_redemption_points} points pour échanger</p>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'échange de points */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <LoyaltyRedeem
              orderTotal={orderTotal}
              onRedeem={handleRedeem}
              onCancel={() => setShowRedeemModal(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LoyaltyCheckout;
