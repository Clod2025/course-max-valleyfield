import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { calculateSuggestedTip, formatCurrency } from '@/utils/receiptCalculator';
import { Sparkles } from 'lucide-react';

interface TipSelectorProps {
  subtotal: number;
  onTipChange: (tip: number) => void;
  currentTip?: number;
}

export const TipSelector: React.FC<TipSelectorProps> = ({
  subtotal,
  onTipChange,
  currentTip = 0
}) => {
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const suggestions = calculateSuggestedTip(subtotal);

  const handlePercentageClick = (percentage: number) => {
    setIsCustomMode(false);
    setCustomTip('');
    onTipChange(Math.round(subtotal * percentage * 100) / 100);
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onTipChange(numValue);
    }
  };

  const handleCustomMode = () => {
    setIsCustomMode(true);
    setCustomTip(currentTip > 0 ? currentTip.toString() : '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Pourboire pour le livreur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Montrez votre appréciation au livreur qui vous apportera votre commande
        </p>

        {/* Options de pourboire suggérées */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={currentTip === suggestions.percentage10 && !isCustomMode ? 'default' : 'outline'}
            onClick={() => handlePercentageClick(0.1)}
            className="flex flex-col items-center py-6 h-auto"
          >
            <span className="text-lg font-semibold">10%</span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(suggestions.percentage10)}
            </span>
          </Button>

          <Button
            type="button"
            variant={currentTip === suggestions.percentage15 && !isCustomMode ? 'default' : 'outline'}
            onClick={() => handlePercentageClick(0.15)}
            className="flex flex-col items-center py-6 h-auto"
          >
            <span className="text-lg font-semibold">15%</span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(suggestions.percentage15)}
            </span>
          </Button>

          <Button
            type="button"
            variant={currentTip === suggestions.percentage20 && !isCustomMode ? 'default' : 'outline'}
            onClick={() => handlePercentageClick(0.2)}
            className="flex flex-col items-center py-6 h-auto"
          >
            <span className="text-lg font-semibold">20%</span>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(suggestions.percentage20)}
            </span>
          </Button>
        </div>

        <Separator />

        {/* Option personnalisée */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="custom-tip">Montant personnalisé</Label>
            {isCustomMode && currentTip > 0 && (
              <span className="text-sm text-muted-foreground">
                {formatCurrency(currentTip)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              id="custom-tip"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={isCustomMode ? customTip : ''}
              onChange={(e) => handleCustomTipChange(e.target.value)}
              onFocus={handleCustomMode}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCustomMode(false);
                setCustomTip('');
                onTipChange(0);
              }}
            >
              Aucun
            </Button>
          </div>
        </div>

        {currentTip > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✓ Pourboire de {formatCurrency(currentTip)} ajouté
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

