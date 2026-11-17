/**
 * Runtime configuration. Values come from `.env` (see `.env.example`).
 * Expo inlines `EXPO_PUBLIC_*` variables at build time — restart Metro with
 * `npx expo start -c` after changing them.
 */
export const config = {
  courtListener: {
    baseUrl: 'https://www.courtlistener.com/api/rest/v4',
    siteUrl: 'https://www.courtlistener.com',
    token: (process.env.EXPO_PUBLIC_COURTLISTENER_TOKEN || '').trim(),
    /**
     * Client-side request budget for the token. Measured at 5/min for the
     * current account; raise this if Free Law Project lifts your limit.
     */
    requestsPerMinute: Number(process.env.EXPO_PUBLIC_COURTLISTENER_RPM) || 5,
  },
  congress: {
    baseUrl: 'https://api.congress.gov/v3',
    siteUrl: 'https://www.congress.gov',
    // DEMO_KEY is api.data.gov's public key: it works out of the box but is
    // heavily rate-limited. Set your own free key for real use.
    apiKey: (process.env.EXPO_PUBLIC_CONGRESS_API_KEY || '').trim() || 'DEMO_KEY',
    usingDemoKey: !(process.env.EXPO_PUBLIC_CONGRESS_API_KEY || '').trim(),
  },
};

export const hasCourtListenerToken = () => config.courtListener.token.length > 0;
