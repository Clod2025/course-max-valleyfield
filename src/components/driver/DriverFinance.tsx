import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Gift,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const DriverFinance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Gains Aujourd'hui</p>
                <p className="text-2xl font-bold text-green-800">156.50$</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Cette Semaine</p>
                <p className="text-2xl font-bold text-blue-800">892.75$</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Pourboires</p>
                <p className="text-2xl font-bold text-purple-800">45.25$</p>
              </div>
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">En Attente</p>
                <p className="text-2xl font-bold text-orange-800">234.50$</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earnings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earnings">Gains</TabsTrigger>
          <TabsTrigger value="tips">Pourboires</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Historique des Gains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">8 livraisons - Aujourd'hui</p>
                    <p className="text-sm text-muted-foreground">9h30 - 17h45</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">156.50$</p>
                    <Badge variant="outline" className="text-green-600">Complété</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">12 livraisons - Hier</p>
                    <p className="text-sm text-muted-foreground">8h00 - 18h30</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">198.75$</p>
                    <Badge className="bg-green-600">Payé</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Pourboires Reçus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Transfert Automatique Activé</span>
                </div>
                <p className="text-sm text-blue-700">
                  Les pourboires sont automatiquement transférés sur votre compte dès réception.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Commande #12345</p>
                    <p className="text-sm text-muted-foreground">Il y a 2 heures</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">5.00$</p>
                    <Badge className="bg-green-600">Transféré</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Commande #12344</p>
                    <p className="text-sm text-muted-foreground">Il y a 4 heures</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">3.50$</p>
                    <Badge className="bg-green-600">Transféré</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Paiements Programmés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Prochain Paiement</span>
                </div>
                <p className="text-sm text-orange-700">
                  Vendredi 20h00 - Tous les gains de la semaine seront transférés.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div>
                    <p className="font-medium">Paiement du 15 Décembre</p>
                    <p className="text-sm text-muted-foreground">Semaine du 9-15 Décembre</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">1,245.50$</p>
                    <Badge className="bg-green-600">Payé</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div>
                    <p className="font-medium">Paiement du 22 Décembre</p>
                    <p className="text-sm text-muted-foreground">Semaine du 16-22 Décembre</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">892.75$</p>
                    <Badge variant="outline" className="text-orange-600">En attente</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
