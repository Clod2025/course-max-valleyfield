# Architecture Machine Learning - CourseMax

## Vue d'ensemble

L'architecture ML de CourseMax est conçue pour prédire les heures de pointe et les produits populaires afin d'optimiser les opérations de livraison et l'inventaire.

## Pipeline de données

### 1. Collecte des données

**Sources de données :**
- `orders` : Commandes avec timestamps, items, montants
- `events` : Interactions utilisateur (vues produits, ajouts panier)
- `products` : Catalogue avec catégories et prix
- `delivery_zones` : Zones géographiques
- Données météo externes (API externe)

### 2. Feature Engineering

**Features temporelles :**
- Heure du jour, jour de la semaine, mois
- Indicateurs weekend/jour férié
- Lags temporels (même heure hier/semaine dernière)

**Features de commandes :**
- Nombre de commandes par heure
- Valeur moyenne des commandes
- Nombre de clients uniques
- Catégories de produits populaires

**Features externes :**
- Conditions météorologiques
- Événements locaux
- Jours fériés

### 3. Modèles ML

**Prédiction de demande (Prophet/XGBoost) :**
```python
# Modèle Prophet pour séries temporelles
from prophet import Prophet

model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=True,
    holidays=canadian_holidays
)

# Features additionnelles
model.add_regressor('temperature')
model.add_regressor('is_weekend')
model.add_regressor('promotion_active')
```

**Détection d'heures de pointe (Classification) :**
```python
# XGBoost pour classification des heures de pointe
import xgboost as xgb

model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1
)

# Features: heure, jour, météo, historique
features = ['hour', 'day_of_week', 'temperature', 'lag_24h', 'lag_168h']
```

### 4. Pipeline d'entraînement

**Étapes :**
1. Export des données depuis Supabase
2. Nettoyage et feature engineering
3. Entraînement des modèles
4. Validation et métriques
5. Déploiement via API

**Exemple de pipeline :**
```python
# scripts/ml_pipeline.py
def train_demand_model():
    # 1. Récupérer les données
    data = fetch_training_data()
    
    # 2. Feature engineering
    features = engineer_features(data)
    
    # 3. Entraîner le modèle
    model = train_prophet_model(features)
    
    # 4. Évaluer
    metrics = evaluate_model(model, test_data)
    
    # 5. Sauvegarder
    save_model(model, metrics)
    
    return model, metrics
```

### 5. API de prédiction

**Endpoint FastAPI :**
```python
# api/predictions.py
from fastapi import FastAPI
import joblib

app = FastAPI()
model = joblib.load('models/demand_forecast_v1.pkl')

@app.post("/predict/demand")
async def predict_demand(request: PredictionRequest):
    features = prepare_features(request.data)
    prediction = model.predict(features)
    
    # Sauvegarder dans Supabase
    await save_prediction(
        model_name="demand_forecast",
        model_version="v1.0",
        prediction_type="demand_forecast",
        input_data=request.data,
        prediction=prediction
    )
    
    return {"prediction": prediction}
```

### 6. Intégration frontend

**Dashboard admin :**
```typescript
// Affichage des prédictions dans le dashboard
const DemandForecastChart = () => {
  const { forecast } = useDemandForecast(24);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prédiction de demande - 24h</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart data={forecast} />
      </CardContent>
    </Card>
  );
};
```

## Déploiement et monitoring

### Infrastructure
- **Entraînement** : Cloud GPU (AWS/GCP)
- **API** : Containers Docker sur Cloud Run
- **Stockage modèles** : Cloud Storage
- **Monitoring** : MLflow + métriques custom

### Métriques de performance
- **RMSE** pour prédictions numériques
- **Accuracy** pour classification heures de pointe
- **Latence** de l'API (<100ms)
- **Fraîcheur** des prédictions (<1h)

### Re-entraînement automatique
- **Fréquence** : Hebdomadaire
- **Trigger** : Dégradation des métriques
- **Validation** : A/B test nouvelles prédictions