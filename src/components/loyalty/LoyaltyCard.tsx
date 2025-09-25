import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Gift, 
  TrendingUp, 
  Clock, 
  Info,
  Sparkles,
  Trophy,
  Target
} from 'lucide-react';
import { useLoyalty } from '@/hooks/useLoyalty';
import { cn } from '@/lib/utils';

interface LoyaltyCardProps {
  className?: string;
  showDetails?: boolean;
  onRedeemClick?: () => void;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  className,
  showDetails = false,
  onRedeemClick
}) => {
  const { account, loading, calculatePointsValue } = useLoyalty();

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2" />
            <p>Système de fidélité non disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pointsValue = calculatePointsValue(account.points);
  const nextReward = account.settings.min_redemption_points;
  const progressToNext = Math.min((account.points / nextReward) * 100, 100);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <span>Points de Fidélité</span>
          {account.settings.loyalty_enabled && (
            <Badge className="bg-green-600">Actif</Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Points actuels */}
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {account.points.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            Points disponibles
          </p>
          <p className="text-lg font-semibold text-green-600">
            = {pointsValue.toFixed(2)}$ de réduction
          </p>
        </div>

        {/* Progression vers la prochaine récompense */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Prochaine récompense</span>
            <span>{nextReward - account.points} points restants</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {nextReward} points = {calculatePointsValue(nextReward).toFixed(2)}$ de réduction
          </p>
        </div>

        {showDetails && (
          <div className="space-y-3 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>1$ dépensé = {account.settings.loyalty_earn_rate} point</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-600" />
                <span>1 point = {account.settings.loyalty_redeem_rate}$</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Minimum {account.settings.min_redemption_points} points pour échanger</p>
              <p>• Maximum {account.settings.max_redemption_percentage}% de réduction par commande</p>
              <p>• Points valides {account.settings.points_expiry_days} jours</p>
            </div>
          </div>
        )}

        {/* Bouton d'échange */}
        {account.points >= account.settings.min_redemption_points && onRedeemClick && (
          <Button 
            onClick={onRedeemClick}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
            disabled={!account.settings.loyalty_enabled}
          >
            <Gift className="w-4 h-4 mr-2" />
            Utiliser mes points
          </Button>
        )}

        {!account.settings.loyalty_enabled && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Info className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-600">
              Le système de fidélité est temporairement désactivé
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyCard;
