declare namespace NodeJS {
  interface ProcessEnv {
    PRICE_PREDICTION_API_URL?: string;
    PRICE_PREDICTION_MARKET?: string;
    PRICE_PREDICTION_PROVINCE?: string;
    PLANTING_CALENDAR_API_URL?: string;
    PEST_RISK_API_URL?: string;
    PEST_RISK_PROVINCE?: string;
    WEATHER_API_TIMEOUT_MS?: string;
    PRICE_API_TIMEOUT_MS?: string;
    INTEGRATION_API_TIMEOUT_MS?: string;
    NASA_POWER_TIMEOUT_MS?: string;
    PEST_RISK_API_TIMEOUT_MS?: string;
  }
}
