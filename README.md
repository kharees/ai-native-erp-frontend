# AI-Native ERP — Frontend

Next.js 14 (App Router) frontend for the multi-tenant AI-Native ERP platform.

Split from the monorepo as a standalone repository. Talks to the backend API (default `http://localhost:8000`).

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 |
| Language | TypeScript |
| State | Zustand + TanStack Query |
| Auth / DB client | Supabase |
| Styling | Tailwind CSS |

## Quick start

```bash
cp .env.example .env.local   # fill in Supabase + API URL
npm install
npm run dev                  # → http://localhost:3000
```

Backend repo: `https://github.com/kharees/ai-native-erp-backend`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright E2E |

## Environment

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_APP_NAME` | App display name |
| `NEXT_PUBLIC_APP_VERSION` | App version |

Never commit `.env.local`.
