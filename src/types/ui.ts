export type Status = 'safe' | 'watch' | 'danger';

export interface ApiProblem {
  error?: {
    message?: string;
    details?: readonly {
      field: string;
      message: string;
    }[];
  };
  message?: string;
}

export interface WeatherInsightDto {
  verdict: import('@/types/api').VerdictDto;
  weather: import('@/types/api').WeatherSnapshotDto;
  pestAlerts: import('@/types/api').PestAlertDto[];
  planting: {
    id: string;
    cropName: string;
    cropSlug: string;
  };
}
