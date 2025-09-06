// Types pour l'infrastructure ML
export interface MLPrediction {
  id: string;
  model_name: string;
  model_version: string;
  prediction_type: 'demand_forecast' | 'peak_hours' | 'popular_products';
  input_data: any;
  prediction: any;
  confidence_score?: number;
  valid_from: string;
  valid_until?: string;
  created_at: string;
}

export interface DemandForecast {
  timestamp: string;
  predicted_orders: number;
  predicted_revenue: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
}

export interface PeakHoursPrediction {
  date: string;
  peak_hours: Array<{
    hour: number;
    predicted_demand: number;
    confidence: number;
  }>;
}

export interface PopularProductsPrediction {
  period: string;
  products: Array<{
    product_id: string;
    product_name: string;
    predicted_sales: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
}

