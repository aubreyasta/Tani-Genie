export type Status = 'safe' | 'watch' | 'danger';

export interface ApiProblem {
  readonly error?: {
    readonly message?: string;
  };
  readonly message?: string;
}

export interface WeatherInsightDto {
  readonly verdict: import('@/types/api').VerdictDto;
  readonly weather: import('@/types/api').WeatherSnapshotDto;
  readonly pestAlerts: ReadonlyArray<import('@/types/api').PestAlertDto>;
  readonly planting: {
    readonly id: string;
    readonly cropName: string;
    readonly cropSlug: string;
  };
}
