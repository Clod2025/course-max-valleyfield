import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Settings, 
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const MapboxSettings: React.FC = () => {
  const [mapboxToken, setMapboxToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMapboxToken();
  }, []);

  const loadMapboxToken = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'mapbox_access_token')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setMapboxToken(data.value as string);
      }
    } catch (error: any) {
      console.error('Error loading Mapbox token:', error);
    }
  };

  const saveMapboxToken = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'mapbox_access_token',
          value: mapboxToken,
          description: 'Token d\'accès Mapbox pour le calcul des distances',
          category: 'delivery',
          is_public: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Token Mapbox sauvegardé",
      });

      // Tester le token
      await testMapboxToken();
    } catch (error: any) {
      console.error('Error saving Mapbox token:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le token Mapbox",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testMapboxToken = async () => {
    if (!mapboxToken) {
      setTokenValid(null);
      return;
    }

    try {
      // Test simple avec l'API Mapbox
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/Valleyfield.json?access_token=${mapboxToken}&limit=1`);
      
      if (response.ok) {
        setTokenValid(true);
        toast({
          title: "Token valide",
          description: "Le token Mapbox fonctionne correctement",
        });
      } else {
        setTokenValid(false);
        toast({
          title: "Token invalide",
          description: "Le token Mapbox ne fonctionne pas",
          variant: "destructive"
        });
      }
    } catch (error) {
      setTokenValid(false);
      toast({
        title: "Erreur de test",
        description: "Impossible de tester le token Mapbox",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Configuration Mapbox
        </CardTitle>
        <CardDescription>
          Configurez votre token d'accès Mapbox pour le calcul des distances de livraison
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="mapbox-token">Token d'accès Mapbox</Label>
          <div className="flex gap-2">
            <Input
              id="mapbox-token"
              type={showToken ? "text" : "password"}
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="pk.eyJ1Ijoi..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          {tokenValid !== null && (
            <div className="mt-2 flex items-center gap-2">
              {tokenValid ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Token valide
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    Token invalide
                  </Badge>
                </>
              )}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-1">
            Obtenez votre token gratuit sur{' '}
            <a 
              href="https://account.mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={saveMapboxToken} 
            disabled={loading || !mapboxToken.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          
          {mapboxToken && (
            <Button 
              variant="outline" 
              onClick={testMapboxToken}
              disabled={loading}
            >
              Tester le token
            </Button>
          )}
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-sm text-blue-800 mb-2">Comment obtenir un token Mapbox :</h4>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>Créez un compte gratuit sur mapbox.com</li>
            <li>Allez dans "Account" → "Access tokens"</li>
            <li>Copiez votre token public (commence par "pk.")</li>
            <li>Collez-le dans le champ ci-dessus</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapboxSettings;
