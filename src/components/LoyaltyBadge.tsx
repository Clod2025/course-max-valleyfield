import { Crown, Gift, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLoyaltyAccount, useCanGetFreeDelivery } from '@/hooks/useLoyalty';

interface LoyaltyBadgeProps {
  variant?: 'compact' | 'detailed';
  showRedeemButton?: boolean;
  onRedeem?: () => void;
}

export const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({
  variant = 'compact',
  showRedeemButton = false,
  onRedeem,
}) => {
  const { data: account, isLoading } = useLoyaltyAccount();
  const { canRedeem, pointsNeeded, currentPoints, pointsRequired } = useCanGetFreeDelivery();

  if (isLoading || !account) {
    return null;
  }

  const progressPercentage = Math.min((currentPoints / pointsRequired) * 100, 100);

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Crown className="w-4 h-4 text-yellow-500" />
          <span className="font-medium text-sm">{currentPoints}</span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
        
        {canRedeem && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Gift className="w-3 h-3 mr-1" />
            Livraison gratuite !
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h3 className="font-semibold text-lg">Programme Fidélité</h3>
            </div>
            <Badge variant="outline" className="bg-white">
              <Zap className="w-3 h-3 mr-1" />
              Niveau Bronze
            </Badge>
          </div>

          {/* Points actuels */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-yellow-600">
              {currentPoints.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              points de fidélité
            </div>
          </div>

          {/* Progression vers la livraison gratuite */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Livraison gratuite
              </span>
              <span className="font-medium">
                {pointsRequired.toLocaleString()} pts
              </span>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="text-center text-xs text-muted-foreground">
              {canRedeem ? (
                <span className="text-green-600 font-medium">
                  🎉 Vous pouvez avoir une livraison gratuite !
                </span>
              ) : (
                <span>
                  Plus que {pointsNeeded.toLocaleString()} points pour une livraison gratuite
                </span>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-yellow-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600">
                {account.total_earned.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Points gagnés
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600">
                {account.total_redeemed.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Points utilisés
              </div>
            </div>
          </div>

          {/* Bouton d'utilisation */}
          {showRedeemButton && canRedeem && onRedeem && (
            <Button 
              onClick={onRedeem}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
            >
              <Gift className="w-4 h-4 mr-2" />
              Utiliser pour livraison gratuite
            </Button>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            Gagnez 1 point pour chaque 10$ dépensés
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
