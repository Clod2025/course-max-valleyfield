import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useLoyaltyAccount } from '@/hooks/useLoyalty';
import { useRecentOrders } from '@/hooks/useRecentOrders';
import { useEventTracking } from '@/hooks/useEventTracking';
import { useValidateDeliveryAddress } from '@/hooks/useGeofencing';
import { 
  ShoppingCart, 
  MessageCircle, 
  MapPin, 
  Calculator,
  Truck,
  Clock,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Store,
  Users,
  Crown,
  CheckCircle,
  XCircle,
  Loader,
  ExternalLink,
  Heart,
  Star,
  TrendingUp
} from 'lucide-react';

// Composant Mini Panier Flottant - SEULEMENT POUR UTILISATEURS CONNECTÉS
const FloatingMiniCart: React.FC = () => {
  const { user, profile } = useAuth();
  const { getCartItemsCount, getCartTotal } = useCart();
  const { trackPageView } = useEventTracking();
  const navigate = useNavigate();

  // 🔒 PROTECTION: Seulement pour utilisateurs connectés
  if (!user || !profile) return null;

  const itemsCount = getCartItemsCount();
  const total = getCartTotal();

  if (itemsCount === 0) return null;

  const handleCartClick = () => {
    trackPageView('/cart');
    navigate('/stores');
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 animate-slide-up">
      <Card 
        className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
        onClick={handleCartClick}
      >
        <CardContent className="p-4 flex items-center space-x-3">
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground min-w-[20px] h-5 rounded-full text-xs flex items-center justify-center">
              {itemsCount}
            </Badge>
          </div>
          <div className="text-sm font-medium">
            {total.toFixed(2)} $
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant Suivi de Commande - SEULEMENT POUR CLIENTS
const LiveOrderTracking: React.FC = () => {
  const { user, profile } = useAuth();
  const { data: recentOrders, isLoading } = useRecentOrders(1);

  // 🔒 PROTECTION: Seulement pour clients connectés
  if (!user || !profile || profile.role !== 'client') return null;
  if (isLoading) return null;

  const activeOrder = recentOrders?.find(order => 
    ['confirmed', 'preparing', 'ready_for_pickup', 'in_delivery'].includes(order.status)
  );

  if (!activeOrder) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: CheckCircle, text: 'Commande confirmée', color: 'text-blue-500', eta: '15-20 min' };
      case 'preparing':
        return { icon: Clock, text: 'En préparation', color: 'text-yellow-500', eta: '10-15 min' };
      case 'ready_for_pickup':
        return { icon: Store, text: 'Prête pour livraison', color: 'text-orange-500', eta: '5-10 min' };
      case 'in_delivery':
        return { icon: Truck, text: 'En route 🚚', color: 'text-green-500', eta: '5-12 min' };
      default:
        return { icon: Clock, text: 'En cours', color: 'text-gray-500', eta: 'N/A' };
    }
  };

  const statusInfo = getStatusInfo(activeOrder.status);
  const IconComponent = statusInfo.icon;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-slide-up">
      <Card className="bg-background border shadow-lg max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <IconComponent className={`w-5 h-5 ${statusInfo.color}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{statusInfo.text}</p>
              <p className="text-xs text-muted-foreground">
                ETA: {statusInfo.eta}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/client`}>
              Suivre
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Suggestions Intelligentes - SEULEMENT POUR UTILISATEURS CONNECTÉS
const SmartSuggestions: React.FC = () => {
  const { user, profile } = useAuth();

  // 🔒 PROTECTION: Seulement pour utilisateurs connectés
  if (!user || !profile) return null;

  // Mock data - À remplacer par de vraies suggestions basées sur l'historique
  const suggestions = [
    { id: 1, name: 'Bananes bio', store: 'IGA', price: 3.99, trending: true },
    { id: 2, name: 'Pain complet', store: 'Boulangerie', price: 4.49, trending: false },
    { id: 3, name: 'Lait 2%', store: 'Metro', price: 5.99, trending: true }
  ];

  return (
    <div className="mt-6">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Tendances dans votre quartier
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {suggestions.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-sm">{item.name}</h5>
                {item.trending && <Badge variant="secondary" className="text-xs">🔥</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{item.store}</p>
              <p className="font-semibold text-primary">{item.price}$</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Calculateur de Frais de Livraison
const DeliveryCalculator: React.FC = () => {
  const [address, setAddress] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<{cost: number, distance: number, available: boolean} | null>(null);

  const calculateDelivery = async () => {
    if (!address.trim()) return;
    
    setIsCalculating(true);
    try {
      // Simulation du calcul (à remplacer par vraie API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock result basé sur l'adresse
      const mockDistance = Math.random() * 15 + 2; // 2-17 km
      const available = mockDistance <= 15;
      const cost = available ? Math.max(3.99, mockDistance * 0.5) : 0;
      
      setResult({
        cost: parseFloat(cost.toFixed(2)),
        distance: parseFloat(mockDistance.toFixed(1)),
        available
      });
    } catch (error) {
      console.error('Erreur calcul livraison:', error);
    }
    setIsCalculating(false);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <Calculator className="w-4 h-4" />
        Calculateur de livraison
      </h4>
      <div className="flex gap-2">
        <Input 
          placeholder="Votre adresse..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={calculateDelivery}
          disabled={isCalculating || !address.trim()}
          size="sm"
        >
          {isCalculating ? <Loader className="w-4 h-4 animate-spin" /> : 'Calculer'}
        </Button>
      </div>
      
      {result && (
        <Card className={`${result.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-3">
            {result.available ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-700">✅ Livraison disponible</p>
                  <p className="text-sm text-muted-foreground">Distance: {result.distance} km</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{result.cost}$</p>
                  <p className="text-xs text-muted-foreground">Frais de livraison</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-semibold text-red-700">❌ Hors zone de livraison</p>
                  <p className="text-sm text-muted-foreground">Max 15 km depuis Valleyfield</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Indicateur de Disponibilité du Service
const ServiceAvailability: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [nextAvailable, setNextAvailable] = useState<string>('');

  useEffect(() => {
    // Vérifier les heures d'ouverture (exemple: 7h-23h)
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= 7 && hour < 23;
    
    setIsAvailable(isOpen);
    
    if (!isOpen) {
      const nextOpen = new Date();
      nextOpen.setHours(hour < 7 ? 7 : 7 + 24, 0, 0, 0);
      setNextAvailable(nextOpen.toLocaleTimeString('fr-CA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    }
  }, []);

  return (
    <Card className={`${isAvailable ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}></div>
          <div className="flex-1">
            <h4 className="font-semibold">
              {isAvailable ? '🟢 Service disponible' : '🟡 Service fermé'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isAvailable ? 
                'Commandes acceptées • Livraisons en cours' : 
                `Réouverture à ${nextAvailable}`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Section Partenaires
const PartnersSection: React.FC = () => {
  const partners = [
    { name: 'IGA Valleyfield', category: 'Épicerie', verified: true },
    { name: 'Pharmaprix', category: 'Pharmacie', verified: true },
    { name: 'Metro Plus', category: 'Épicerie', verified: true },
    { name: 'SAQ', category: 'Alcool', verified: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Store className="w-4 h-4" />
          Nos partenaires
        </h4>
        <Button variant="outline" size="sm" asChild>
          <Link to="/stores">
            Voir tous
            <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {partners.map((partner, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className={`w-2 h-2 rounded-full ${partner.verified ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{partner.name}</p>
              <p className="text-xs text-muted-foreground">{partner.category}</p>
            </div>
          </div>
        ))}
      </div>
      
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-center">
          <Crown className="w-6 h-6 mx-auto mb-2 text-primary" />
          <h5 className="font-semibold mb-1">Devenez partenaire</h5>
          <p className="text-sm text-muted-foreground mb-3">
            Rejoignez notre réseau de magasins
          </p>
          <Button size="sm" className="w-full">
            Postuler maintenant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant Principal AppFooter avec Protections
export const AppFooter: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Composants flottants - SEULEMENT pour utilisateurs connectés */}
      {user && profile && (
        <>
          <FloatingMiniCart />
          {profile.role === 'client' && <LiveOrderTracking />}
        </>
      )}

      {/* Footer principal */}
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Section Entreprise */}
            <div className="space-y-4">
              <Link to="/home" className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                  alt="CourseMax" 
                  className="h-8 w-auto"
                />
                <span className="font-bold text-xl">CourseMax</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                La plateforme de livraison rapide qui connecte clients, 
                livreurs et magasins à Valleyfield.
              </p>
              <div className="flex space-x-3">
                <Button variant="ghost" size="sm">
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Instagram className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Twitter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Navigation rapide */}
            <div className="space-y-4">
              <h4 className="font-semibold">Navigation</h4>
              <div className="space-y-2 text-sm">
                <Link to="/stores" className="block hover:text-primary transition-colors">
                  Magasins
                </Link>
                {user ? (
                  <>
                    <Link to={profile?.role === 'client' ? '/dashboard/client' : '/dashboard'} className="block hover:text-primary transition-colors">
                      Mon tableau de bord
                    </Link>
                    <button 
                      onClick={signOut}
                      className="block hover:text-primary transition-colors text-left"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block hover:text-primary transition-colors">
                      Connexion
                    </Link>
                    <Link to="/register" className="block hover:text-primary transition-colors">
                      Inscription
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Support & Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>(450) 123-4567</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>support@coursemax.ca</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Valleyfield, QC</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat en direct
                </Button>
              </div>
            </div>

            {/* Section dynamique selon le statut utilisateur */}
            <div className="space-y-4">
              <ServiceAvailability />
              
              {/* Calculateur pour tous */}
              <DeliveryCalculator />
              
              {/* Suggestions seulement pour utilisateurs connectés */}
              {user && profile && <SmartSuggestions />}
              
              {/* Partenaires pour visiteurs non connectés */}
              {!user && <PartnersSection />}
            </div>
          </div>
          
          <Separator className="my-8" />
          
          {/* Bas de page */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <div className="mb-4 md:mb-0">
              © 2024 CourseMax. Tous droits réservés.
            </div>
            <div className="flex space-x-4">
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Confidentialité
              </Link>
              <Link to="/terms" className="hover:text-primary transition-colors">
                Conditions
              </Link>
              <Link to="/help" className="hover:text-primary transition-colors">
                Aide
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};