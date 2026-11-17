# Benchmark Justice™ Mobile App (React Native & Expo)

Cross-platform mobile application for **Benchmark Justice™**, mirroring the exact dark theme, UI colors, components, and live judicial intelligence features of the web platform.

---

## Architecture & Integration

- **Frontend Mobile**: React Native + Expo + TypeScript
- **Navigation**: React Navigation Native Stack
- **Icons & Graphics**: React Native SVG, Lucide Icons
- **Backend API**: Connected to the shared NestJS API on `http://10.0.2.2:4000` (Android Emulator) / `http://localhost:4000` (iOS / Web)
- **Authentication**: `AsyncStorage` JWT Session Persistence

---

## Screen Suite

1. **Home Screen (`HomeScreen`)**: Centered 3X Logo Header, Universal Search with live autocomplete, Coverage Counters, Entity Cards, Live Intelligence Feed, and Methodology.
2. **Search Results (`SearchResultsScreen`)**: Filter by All, Judges, Attorneys, Prosecutors, Congress with instant results.
3. **Judicial Profile (`JudgeProfileScreen`)**: BJI (Benchmark Judicial Index) score meter, Case Breakdown Grid, Synchronized Historical Trend Graph, Decade Timeline Tabs, and Case Record Table with CourtListener links.
4. **Attorney Profile (`AttorneyProfileScreen`)**: API (Attorney Performance Index), Case Breakdown, Decade Timeline Tabs, and Case Table.
5. **Prosecutor Profile (`ProsecutorProfileScreen`)**: PDI (Prosecutorial Disposition Index), Disposition Breakdown, Decade Timeline Tabs, and Case Table.
6. **Congressional Profile (`LegislatorProfileScreen`)**: LVI (Legislative Voting Index) and key roll call voting records.
7. **Activity Feed (`ActivityScreen`)**: Real-time live public audit intelligence stream.
8. **Auth (`LoginScreen` & `SignupScreen`)**: Dark glassmorphism authentication with session persistence.

---

## Live Data Sources

All legal data is fetched live — there is no bundled or sample data.

| Source | Used for |
|---|---|
| [CourtListener API v4](https://www.courtlistener.com/help/api/rest/v4/) | Judges, courts, case law, dockets, docket entries, parties, attorneys, citation lookup |
| [Congress.gov API v3](https://api.congress.gov/) | Members of Congress, terms, sponsored legislation |
| Benchmark Justice backend | Sign-in / sign-up only |

### Configuration

Copy `.env.example` to `.env` and fill in:

```bash
EXPO_PUBLIC_COURTLISTENER_TOKEN=   # https://www.courtlistener.com/profile/api/
EXPO_PUBLIC_CONGRESS_API_KEY=      # https://api.data.gov/signup/ (DEMO_KEY used if empty)
EXPO_PUBLIC_COURTLISTENER_RPM=5    # optional: client request budget per minute
```

Restart Metro with `npx expo start -c` after changing `.env`. `EXPO_PUBLIC_*` values are compiled into the app bundle.

The app queues CourtListener requests to stay within the token's rate limit and caches responses on the device (30 min – 24 h depending on the data).

## How to Run

### 1. Ensure Backend is Running
```bash
cd backend
npm run dev
```

### 2. Start the Mobile App
```bash
cd mobile
npm start
```
- Press `a` to open in Android Emulator / Device.
- Press `i` to open in iOS Simulator.
- Press `w` to open in Web Browser.
