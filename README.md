# SocialScience

Monorepo for a social/analytics web app: React SPA + Express API, Postgres, and Bluesky (ATProto) + LLM integrations.

## Tech stack

| Layer | Stack |
| --- | --- |
| **Runtime & tooling** | [Bun](https://bun.sh) workspaces |
| **Client** | React 19, Vite 8, TypeScript, Tailwind CSS 4, TanStack Query, Zustand, React Router 7, Recharts; React Compiler (Babel) |
| **Server** | Express 5 on Bun, Drizzle ORM, `postgres` driver, Zod; JWT auth; Anthropic & OpenAI SDKs; ATProto (`@atproto/*`) for Bluesky |
| **Database** | PostgreSQL 16 (local via Docker) |
| **Shared** | `packages/shared` — Zod types/schemas |

## Run locally

**Prerequisites:** [Bun](https://bun.sh) and Docker (for Postgres).

1. **Start Postgres**

   ```bash
   docker compose up -d
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Fill in the values below (add `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` only if you use those features).

   | Variable | What it does | How to set it (local + default `docker compose`) |
   | --- | --- | --- |
   | `DATABASE_URL` | Connection string for Drizzle → Postgres. | With the default Compose setup, use `postgresql://postgres@localhost:5432/socialscience` (from `docker-compose.yml`: DB `socialscience`, user `postgres`, port `5432`, trust auth). Adjust host/port/user/password/db if you changed Compose or use a remote DB. |
   | `JWT_SECRET` | **Signs and verifies** login JWTs; compromise allows forging sessions. | **Generate** (do not copy from docs): `openssl rand -hex 32`, paste into `.env`. |
   | `ENCRYPTION_KEY` | **Encrypts sensitive data at rest** (e.g. stored credentials). Changing it invalidates existing ciphertext. | Must be **64 hex chars** (32 bytes). Generate: `openssl rand -hex 32`, paste into `.env`. |

   Generate secrets and paste them over the placeholders in `.env` (run twice—use a different value for each variable):

   ```bash
   openssl rand -hex 32
   ```

3. **Install & schema**

   ```bash
   bun install
   bun run db:push
   ```

4. **Dev (client + API)**

   ```bash
   bun run dev
   ```

   - App UI: `http://localhost:5173` (Vite proxies `/api` → `http://localhost:3001`)
   - API: `http://localhost:3001` (`GET /health`, routes under `/api/v1`)

**Other commands:** `bun run build` (all packages), `bun run lint`, `bun run db:generate` / `db:migrate` for Drizzle migrations.

## Deploy

There is no vendor-specific config in-repo; use any host that can run **Bun** (or Node if you adapt the server entry) and **PostgreSQL**.

**Suggested layout**

1. **Database** — Managed Postgres; set `DATABASE_URL`, `NODE_ENV=production`, and the same secrets as locally (`JWT_SECRET`, `ENCRYPTION_KEY`, optional LLM keys).

2. **API** — Build (`bun run build`), run the compiled server (e.g. `bun packages/server/dist/index.js` after `tsc` output). Expose the process on `PORT` (default `3001`).

3. **Client** — Build the Vite app (`packages/client` → static `dist`). The browser calls **`/api/v1` on the same origin**, so put the static files and the API behind one **reverse proxy** (e.g. nginx/Caddy) that serves the SPA and forwards `/api` to the API process. That matches dev (relative `/api` + proxy) and avoids CORS changes.

If you must split frontend and API on **different origins**, you will need to **widen CORS** in the server (it is currently scoped to local dev) and likely add a configurable API base URL for the client—those changes are not in this template.
