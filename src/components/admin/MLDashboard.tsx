import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDemandForecast, usePeakHoursPrediction } from '@/hooks/useMLPredictions';
import { Clock, TrendingUp, Brain, AlertCircle } from 'lucide-react';

export const MLDashboard: React.FC = () => {
  const { forecast, isLoading: loadingForecast, lastUpdated } = useDemandForecast(24);
  const { peakHours, isLoading: loadingPeakHours } = usePeakHoursPrediction();

  if (loadingForecast || loadingPeakHours) {
    return <div>Chargement des prédictions ML...</div>;
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const nextPeakHour = peakHours?.peak_hours?.[0];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Prédictions Machine Learning</h2>
        </div>
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Mis à jour: {lastUpdated ? formatTime(lastUpdated) : 'N/A'}
        </Badge>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochaine heure de pointe</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextPeakHour ? `${nextPeakHour.hour}:00` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextPeakHour ? `${nextPeakHour.predicted_demand} commandes prévues` : 'Données indisponibles'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes prévues (24h)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast.reduce((sum, f) => sum + f.predicted_orders, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total sur les 24 prochaines heures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiance du modèle</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextPeakHour ? `${Math.round(nextPeakHour.confidence * 100)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Prédiction des heures de pointe
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique de prédiction de demande */}
      <Card>
        <CardHeader>
          <CardTitle>Prédiction de demande - 24 heures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => formatTime(value)}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatTime(value)}
                  formatter={(value: number, name: string) => [
                    Math.round(value),
                    name === 'predicted_orders' ? 'Commandes prévues' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_orders" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Heures de pointe prédites */}
      {peakHours && (
        <Card>
          <CardHeader>
            <CardTitle>Heures de pointe prédites - {peakHours.date}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {peakHours.peak_hours.slice(0, 8).map((hour) => (
                <div key={hour.hour} className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-lg font-bold">{hour.hour}:00</div>
                  <div className="text-sm text-muted-foreground">
                    {hour.predicted_demand} commandes
                  </div>
                  <div className="text-xs mt-1">
                    <Badge variant={hour.confidence > 0.8 ? 'default' : 'secondary'}>
                      {Math.round(hour.confidence * 100)}% confiance
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};