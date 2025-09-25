import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Star, 
  DollarSign, 
  Info,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useLoyalty } from '@/hooks/useLoyalty';
import { cn } from '@/lib/utils';

interface LoyaltyRedeemProps {
  orderTotal: number;
  onRedeem: (points: number, discount: number) => void;
  onCancel: () => void;
  className?: string;
}

export const LoyaltyRedeem: React.FC<LoyaltyRedeemProps> = ({
  orderTotal,
  onRedeem,
  onCancel,
  className
}) => {
  const { account, calculatePointsValue, calculateMaxRedeemablePoints, canRedeemPoints } = useLoyalty();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const maxRedeemablePoints = calculateMaxRedeemablePoints(orderTotal);
  const discountAmount = calculatePointsValue(pointsToRedeem);
  const newOrderTotal = Math.max(0, orderTotal - discountAmount);

  useEffect(() => {
    // Réinitialiser les points à échanger quand l'ordre change
    setPointsToRedeem(0);
  }, [orderTotal]);

  const handleSliderChange = (value: number[]) => {
    setPointsToRedeem(value[0]);
  };

  const handleInputChange = (value: string) => {
    const points = parseInt(value) || 0;
    const maxPoints = Math.min(maxRedeemablePoints, account?.points || 0);
    setPointsToRedeem(Math.max(0, Math.min(points, maxPoints)));
  };

  const handleRedeem = async () => {
    if (!account || pointsToRedeem <= 0) return;

    setIsRedeeming(true);
    try {
      onRedeem(pointsToRedeem, discountAmount);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleMaxRedeem = () => {
    setPointsToRedeem(maxRedeemablePoints);
  };

  if (!account || !account.settings.loyalty_enabled) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Système de fidélité indisponible</h3>
          <p className="text-muted-foreground">
            Le système de fidélité est temporairement désactivé
          </p>
        </CardContent>
      </Card>
    );
  }

  if (account.points < account.settings.min_redemption_points) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Points insuffisants</h3>
          <p className="text-muted-foreground mb-4">
            Vous avez {account.points} points. Il vous faut {account.settings.min_redemption_points} points minimum pour échanger.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Il vous manque {account.settings.min_redemption_points - account.points} points</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-blue-600" />
          Utiliser mes Points de Fidélité
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Points disponibles */}
        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold">Points disponibles</p>
              <p className="text-2xl font-bold text-yellow-600">
                {account.points.toLocaleString()}
              </p>
            </div>
          </div>
          <Badge className="bg-yellow-600">
            = {calculatePointsValue(account.points).toFixed(2)}$
          </Badge>
        </div>

        {/* Sélection des points */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="points-input" className="text-base font-medium">
              Points à utiliser
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                id="points-input"
                type="number"
                value={pointsToRedeem}
                onChange={(e) => handleInputChange(e.target.value)}
                min={0}
                max={maxRedeemablePoints}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleMaxRedeem}
                disabled={maxRedeemablePoints === 0}
              >
                Maximum
              </Button>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0 points</span>
              <span>{maxRedeemablePoints} points max</span>
            </div>
            <Slider
              value={[pointsToRedeem]}
              onValueChange={handleSliderChange}
              max={maxRedeemablePoints}
              step={account.settings.min_redemption_points}
              className="w-full"
            />
          </div>
        </div>

        {/* Calcul de la réduction */}
        {pointsToRedeem > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">Réduction calculée</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Points utilisés</p>
                <p className="font-semibold">{pointsToRedeem.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Réduction</p>
                <p className="font-semibold text-green-600">
                  -{discountAmount.toFixed(2)}$
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nouveau total */}
        {pointsToRedeem > 0 && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nouveau total</p>
                <p className="text-2xl font-bold text-green-600">
                  {newOrderTotal.toFixed(2)}$
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Économies</p>
                <p className="text-lg font-semibold text-green-600">
                  {discountAmount.toFixed(2)}$
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informations */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <p>• Minimum {account.settings.min_redemption_points} points requis</p>
              <p>• Maximum {account.settings.max_redemption_percentage}% de réduction par commande</p>
              <p>• 1 point = {account.settings.loyalty_redeem_rate}$ de réduction</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Validation */}
        {pointsToRedeem > 0 && !canRedeemPoints(pointsToRedeem, orderTotal) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {pointsToRedeem < account.settings.min_redemption_points
                ? `Minimum ${account.settings.min_redemption_points} points requis`
                : pointsToRedeem > account.points
                ? 'Points insuffisants'
                : 'Limite de réduction dépassée'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isRedeeming}
          >
            Annuler
          </Button>
          <Button
            onClick={handleRedeem}
            disabled={
              isRedeeming ||
              pointsToRedeem <= 0 ||
              !canRedeemPoints(pointsToRedeem, orderTotal)
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isRedeeming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Traitement...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Utiliser {pointsToRedeem} points
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoyaltyRedeem;
