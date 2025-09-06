import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star,
  Truck,
  Share2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StoreInfoProps {
  storeId: string;
}

interface StoreDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  description: string;
  rating: number;
  delivery_fee: number;
  min_order: number;
  estimated_delivery: number;
  is_open: boolean;
  opening_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

const StoreInfo = ({ storeId }: StoreInfoProps) => {
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();

        if (error) throw error;
        setStore(data);
      } catch (error) {
        console.error('Error fetching store info:', error);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStoreInfo();
    }
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  const currentHour = new Date().getHours();
  const isOpen = store.is_open && currentHour >= 8 && currentHour < 22;

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <MapPin className="w-4 h-4" />
        <span>{store.address}, {store.city}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span>{store.rating.toFixed(1)}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Truck className="w-4 h-4" />
        <span>{store.estimated_delivery} min</span>
      </div>
      
      <Badge variant={isOpen ? 'default' : 'secondary'}>
        {isOpen ? 'Ouvert' : 'Fermé'}
      </Badge>
      
      <Button variant="ghost" size="sm" className="h-6 px-2">
        <Share2 className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default StoreInfo;