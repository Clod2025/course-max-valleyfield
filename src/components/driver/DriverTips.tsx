import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Gift, 
  TrendingUp, 
  CheckCircle, 
  Settings,
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react';

export const DriverTips = () => {
  const [autoTransfer, setAutoTransfer] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Gift className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">Pourboires</h1>
          <p className="text-muted-foreground">Gérez vos pourboires et transferts</p>
        </div>
      </div>

      {/* Résumé des pourboires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Aujourd'hui</p>
                <p className="text-2xl font-bold text-purple-800">12.50$</p>
              </div>
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Cette Semaine</p>
                <p className="text-2xl font-bold text-green-800">89.75$</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Total du Mois</p>
                <p className="text-2xl font-bold text-blue-800">342.25$</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration du transfert automatique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuration des Transferts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium">Transfert Automatique</h4>
              <p className="text-sm text-muted-foreground">
                Les pourboires sont automatiquement transférés sur votre compte dès réception
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={autoTransfer}
                onCheckedChange={setAutoTransfer}
              />
              {autoTransfer && (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Activé
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des pourboires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Historique des Pourboires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Commande #12347</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Il y a 1 heure • Marie Dubois
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">5.00$</p>
                <Badge className="bg-green-600">Transféré</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Commande #12346</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Il y a 2 heures • Jean Martin
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">3.50$</p>
                <Badge className="bg-green-600">Transféré</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Commande #12345</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Il y a 3 heures • Sophie Tremblay
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">4.00$</p>
                <Badge className="bg-green-600">Transféré</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques mensuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Statistiques Mensuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Pourboires par Semaine</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Semaine 1</span>
                  <span className="font-medium">78.50$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Semaine 2</span>
                  <span className="font-medium">92.25$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Semaine 3</span>
                  <span className="font-medium">82.75$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Semaine 4 (actuelle)</span>
                  <span className="font-medium text-purple-600">89.75$</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Moyennes</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pourboire moyen</span>
                  <span className="font-medium">4.25$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Par livraison</span>
                  <span className="font-medium">3.80$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Par jour</span>
                  <span className="font-medium">12.50$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taux de pourboire</span>
                  <span className="font-medium text-green-600">85%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
