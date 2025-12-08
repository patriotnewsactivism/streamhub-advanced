# Repository Guidelines

## Project Structure & Module Organization
- Frontend lives at repo root: entry points `index.tsx` and `App.tsx`, feature views in `components/`, shared types in `types.ts`, and API helpers in `services/geminiService.ts`.
- Backend lives in `backend/`: Express/Node Media Server in `server.js`, database bootstrap in `init-db.js`, and its own `package.json`.
- Infrastructure: Docker files (`Dockerfile*`, `docker-compose.yml`), Nginx config (`default.conf`), Terraform bits (`service-networking-iam.tf`), and SQL schema seeds (`init.sql`).
- Docs worth skimming: `README.md` for app overview, `DOCKER_README.md` for container workflows, and `CLAUDE.md`/`PLAN.md`/`TODO.md` for roadmap context.

## Build, Test, and Development Commands
- Install frontend deps: `npm install` (root). Run dev server at `npm run dev` (Vite on :3000) and production build with `npm run build`; `npm run preview` serves the built assets.
- Backend: `cd backend && npm install && npm run start` (Node 18+, RTMP/HLS + REST). `npm run dev` uses nodemon for quick iteration.
- Full stack via Docker: `docker-compose up --build` exposes frontend on :8080, API on :3000, RTMP on :1935, HLS on :8000, plus Redis/Postgres.

## Connectivity & Verification
- Backend health: `curl http://localhost:3000/health` locally; Cloud Run uses the `PORT` env (defaults to 8080) and must be reachable before frontend builds.
- Frontend->backend wiring: set `VITE_BACKEND_URL` (Cloud Run URL or `http://localhost:3000`); the app pings `/health` on load and surfaces status.
- Database schema: `cd backend && npm run init-db` seeds users/destinations against the configured Postgres/Cloud SQL instance; docker-compose loads `init.sql` automatically.
- Media storage: RTMP/HLS outputs write to `/app/media` (mapped to `media-storage` volume in docker-compose); use a persistent disk or bucket mount in production VMs.

## Coding Style & Naming Conventions
- TypeScript + React with ESM; prefer functional components and hooks. Keep indentation at 2 spaces and align with existing spacing in `components/*.tsx`.
- Components and files in `components/` use `PascalCase`; variables/functions/hooks use `camelCase`. Co-locate small helpers with their component; add shared types to `types.ts`.
- Favor early returns over deeply nested conditionals; keep JSX lean and extract sections into subcomponents when they exceed ~150 lines.
- No global formatter is wired; match current style and add minimal, purpose-driven comments only where intent is non-obvious.

## Testing Guidelines
- There is no automated test suite yet. Before opening a PR, run `npm run dev` (frontend) and `npm run start` in `backend/`, then manually smoke-test: auth modal flows, destination add/remove, layout switching, media uploads, and start/stop streaming toggles.
- When adding tests, prefer lightweight unit/DOM tests (Vitest + React Testing Library) placed alongside components (`ComponentName.test.tsx`) and keep coverage for new logic above 80%.

## Commit & Pull Request Guidelines
- Recent history uses short, imperative subjects (e.g., “Add deployment status checklist”); follow that style and keep commits scoped.
- PRs should include: purpose and scope, setup/env changes (`.env.example` updates), screenshots or short clips for UI changes, and a brief test/QA note.
- Link issues or related PRs when applicable, and avoid landing large, multi-surface diffs—split frontend/backend/infrastructure work into separate PRs for clearer review.

## Security & Configuration Tips
- Never commit secrets; base configs live in `.env.example`. Required keys: `VITE_GEMINI_API_KEY` for the frontend and DB/Redis URLs for the backend/docker-compose stack.
- Keep streaming ports consistent with `docker-compose.yml` (1935 RTMP, 8000 HLS) and update `default.conf` if you change routing.
- If modifying storage or cloud imports, ensure bucket permissions and CORS rules align with the GCS settings referenced in `GCP_DEPLOYMENT.md`.
