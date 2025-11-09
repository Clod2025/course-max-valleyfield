import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Truck } from "lucide-react";

interface StoreCardProps {
  id: string;
  name: string;
  address: string;
  distance: number;
  deliveryFee: number;
  estimatedTime: string;
  type: string;
  isOpen: boolean;
  onClick: () => void;
}

export function StoreCard({
  name,
  address,
  distance,
  deliveryFee,
  estimatedTime,
  type,
  isOpen,
  onClick
}: StoreCardProps) {
  return (
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-coursemax hover:scale-105 animate-slide-up">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">{name}</h3>
            <div className="flex items-center text-muted-foreground text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{address}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center">
                <Truck className="w-4 h-4 mr-1 text-primary" />
                <span className="font-medium">{distance.toFixed(1)}km</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-accent" />
                <span>{estimatedTime}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {isOpen ? (
              <Badge variant="default" className="bg-accent text-accent-foreground mb-2">
                Ouvert
              </Badge>
            ) : (
              <Badge variant="destructive" className="mb-2">
                Fermé
              </Badge>
            )}
            <div className="text-sm text-muted-foreground mb-1">Livraison</div>
            <div className="text-lg font-bold text-primary">{deliveryFee.toFixed(2)}$</div>
          </div>
        </div>
        
        <Button 
          onClick={onClick}
          disabled={!isOpen}
          className="w-full gradient-primary text-white font-medium hover:opacity-90"
        >
          {isOpen ? `Commander chez ${name}` : 'Fermé'}
        </Button>
      </CardContent>
    </Card>
  );
}
