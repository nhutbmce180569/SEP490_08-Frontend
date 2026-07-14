import { apiClient } from "../../../utils/axiosClient";

export interface PredictedTourItem {
  id: number;
  name: string;
  imageUrl?: string;
  city?: string;
  trendScore: number;
  reviewCount: number;
  averageStar?: number;
  minPrice?: number;
  durationDays?: number;
  occupancyRate?: number;
  wishlistAdds?: number;
  conversionRate?: number;
  projectedRevenue?: number;
}

export interface TrendEvidence {
  type: string;
  title: string;
  description: string;
}

export interface ProvinceForecast {
  province: string;
  hotnessScore: number;
  status: string;
}

export interface TrendPredictionResponse {
  targetMonth: number;
  targetYear: number;
  suggestedTourType: string;
  reason: string;
  evidences: TrendEvidence[];
  provinceForecasts: ProvinceForecast[];
  predictedTours: PredictedTourItem[];
}

export const getTrendPrediction = (targetMonth?: number, targetYear?: number) => {
  return apiClient.get<TrendPredictionResponse>("/ai/trends/hot-tours", {
    params: { targetMonth, targetYear },
  });
};
