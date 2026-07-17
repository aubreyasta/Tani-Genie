# Integration into `aubreyasta/Tani-Genie` branch `dev`

The repository currently exposes `/peringatan` and computes a generic `Risiko Hama`
inside `src/modules/insights/verdict-engine.ts`. Keep that function as an offline
fallback; use the Python service for disease-specific scores.

Copy the supplied files into the same paths in Tani-Genie:

```text
src/types/pest-risk.ts
src/modules/integrations/pest-risk-client.ts
src/app/api/insights/pest-risk/route.ts
src/components/pest-risk-card.tsx
```

Add this environment variable:

```env
PEST_RISK_API_URL=http://localhost:8002
```

The web application should send at least 14 daily records and preferably 90 daily
weather/soil records for a planting and POST it to:

```text
POST /api/insights/pest-risk
```

Then render the response on `/peringatan`:

```tsx
<PestRiskCard result={pestRiskResult} />
```

Do not replace `computeWeatherVerdict` entirely until the Python service has
monitoring and an uptime target. When the service is unavailable, show the old
weather verdict and label disease-specific risk as unavailable rather than safe.

The Prisma snippet is optional. It stores immutable prediction snapshots and
farmer observations for later gold-label creation and active learning.
