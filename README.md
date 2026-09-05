# Mkash Travel

Standalone React app extracted from the Mkash Super App. Runs **only** the Travel mini-app — flights, hotels, bus, train booking, and all related UI.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174)

## Build for production

```bash
npm run build
npm run preview
```

## What's included

- Full Travel UI (`EthioHome`, booking funnel, bottom nav, sheets)
- Auth flow (onboarding, PIN unlock) required for payments
- Payment method picker and transaction PIN sheets
- Tailwind theme, Inter + Noto Sans Ethiopic fonts
- Lucide icons, Framer Motion animations, Sonner toasts

## Project structure

```
src/
  pages/Travel.tsx          # Main travel screen
  components/travel/        # Travel-specific UI
  components/               # Shared UI (TopBar, auth, payments)
  App.tsx                   # Router + providers
  index.css                 # Global styles + Tailwind
public/                     # Static assets
```

## Default login

Use any phone number and PIN during onboarding (demo auth — stored in `localStorage`).
# travelapp
