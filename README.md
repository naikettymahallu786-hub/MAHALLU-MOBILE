# Mahallu ERP — Mobile

Expo 54 / React Native 0.81 app for the Mahallu ERP system.

Extracted from the `MAHALLU` monorepo (`apps/mobile`) with full commit history preserved for this
app's files. The two symbols previously imported from the shared workspace package (`UserRole`,
`AuthTokens`) have been inlined at `lib/types.ts`; the vendored `packages/` directory and its
`metro.config.js`/`babel.config.js` aliases were removed.

## Setup

```bash
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL
npm start
```

## Scripts

- `npm start` — start the Expo dev server
- `npm run android` / `npm run ios` — run on a device/simulator
- `npm run build:android` / `npm run build:ios` — EAS build
- `npm run type-check` — `tsc --noEmit`
- `npm run lint` — Expo lint

## EAS project

This repo's `app.json` does not carry an `extra.eas.projectId`. Run `eas init` once to link (or
create) an EAS project before building with `eas build`.

## Environment variables

`EXPO_PUBLIC_API_URL` — also set per build profile in `eas.json` (`preview`, `production`).

## Native project

`android/` is a checked-in prebuild (package `com.mahallu.erp`). There is no `ios/` directory —
run `npx expo prebuild --platform ios` to generate one, or build with EAS which prebuilds
remotely.
