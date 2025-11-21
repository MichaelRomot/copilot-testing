<!--
  Repository-specific Copilot instructions for AI coding agents.
  Purpose: give immediate, actionable knowledge about architecture, workflows,
  and conventions so an AI agent can make safe, useful changes.
-->

# Copilot Instructions — copilot-testing

Summary

- Monorepo (npm/Bun workspaces) with three packages under `packages/`: `client` (React + Vite),
  `server` (NestJS), and `mcp` (placeholder).
- Package manager: Bun (root `package.json` includes `packageManager` and we commit a `bun.lock`).
- CI: GitHub Actions workflow (`.github/workflows/lint.yml`) installs Bun, runs `bun install --frozen-lockfile`, then `bun run lint` and `bunx prettier --check .`.

Big picture / architecture

- Root: orchestrates development via npm/Bun workspaces (`packages/*`).
- `packages/client`: Vite + React TypeScript app. Entry: `packages/client/src/main.tsx` and `index.html`.
- `packages/server`: NestJS TypeScript app. Entry: `packages/server/src/main.ts` (listens on port 3000). Controller example: `packages/server/src/app.controller.ts`.
- `packages/mcp`: intentionally empty placeholder for MCP-related code.

Developer workflows (how to run, build, lint, format)

- Install deps: `bun install` (root). The repo uses Bun lockfile; CI runs with `--frozen-lockfile` — keep `bun.lock`/`bun.lockb` committed.
- Start server (dev): `bun run dev:server` (runs `ts-node-dev` inside `packages/server`).
- Start client (dev): `bun run dev:client` (runs Vite in `packages/client`).
- Start both: `bun run dev` (root script shells to each package using `concurrently`).
- Build client: `cd packages/client && bun run build` (uses Vite `build`).
- Build server: `bun run build` in `packages/server` runs `tsc -p tsconfig.build.json`.
- Lint: `bun run lint` (root runs ESLint across repo). Auto-fix: `bun run lint:fix`.
- Format: `bun run format` (runs Prettier `--write`). CI uses `prettier --check`.

Repo-specific conventions & patterns

- Use Bun as the canonical package manager. If you change dependencies, update the lockfile with `bun install` and commit it. CI uses `--frozen-lockfile` and will fail if lockfile differs.
- Root `package.json` uses workspace commands that `cd` into packages — agent edits should respect these scripts.
- TypeScript: per-package `tsconfig.json`; root `tsconfig.json` references package tsconfigs to satisfy ESLint type-aware rules.
- ESLint: `.eslintrc.cjs` uses per-package `overrides` with `parserOptions.project` pointing to each package's `tsconfig.json` (do not assume a single top-level project file for type-aware rules).
- Prettier: `.prettierrc` enforces single quotes, 80 char width, trailing commas — CI enforces formatting with `prettier --check`.
- Git hooks: Husky + lint-staged are configured. `prepare` script runs `husky install`; `.husky/pre-commit` runs `lint-staged` to auto-run `eslint --fix` and `prettier --write` on staged files.

Containerization requirement

- The `client` and `server` packages MUST include a `Dockerfile` (and optional `.dockerignore`) so they can be built into container images. Place them at:
  - `packages/client/Dockerfile`
  - `packages/server/Dockerfile`
- Minimal expectations:
  - `client` Dockerfile: run `bun install` and `bun run build`, then serve the `dist` artifact (e.g. via `nginx` or a small static server).
  - `server` Dockerfile: run `bun install` and the TypeScript build (`bun run build` / `tsc -p tsconfig.build.json`) and run `node dist/main.js` in the final image.
  - Use multi-stage builds to keep runtime images small.
- Example (client) Dockerfile:

  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY . .
  RUN bun install && bun run build

  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```

- Example (server) Dockerfile:

  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY . .
  RUN bun install && bun run build

  FROM node:20-alpine
  WORKDIR /app
  COPY --from=builder /app/dist ./dist
  EXPOSE 3000
  CMD ["node", "dist/main.js"]
  ```

- CI notes: If Dockerfiles are added/changed, update workflows to build/tag images as needed. Use commit SHA tags for reproducibility and only push images from main or release branches unless you intentionally build PR images.

Integration points & external dependencies

- Server: NestJS (`@nestjs/*`) — minimal app exposes a root GET endpoint. No DB or external services are configured.
- Client: React + Vite. No proxy configured — if you add API calls to the server during dev, either update Vite dev server proxy or run client and server on separate ports and configure CORS in `server`.
- CI: GitHub Actions, runner installs Bun via the official install script and expects `bun.lock` to be present.

Agent guidance (what to do when changing code)

1. Always run `bun install` after changing dependencies and commit the updated `bun.lock` (CI requires frozen lockfile).
2. Run formatting and lint locally before committing: `bun run format` and `bun run lint:fix`.
3. Ensure `husky install` has been run (or `bun run prepare`) when adding hooks; mark `.husky/*` hooks executable in git index.
4. When modifying TypeScript/ESLint config, prefer adding per-package `overrides` rather than a single project path; see current `.eslintrc.cjs` for examples.
5. When editing build or CI behavior, update `.github/workflows/lint.yml` to maintain Bun install and `--frozen-lockfile` usage; if you change lockfile strategy, update workflow accordingly.

Files worth inspecting for concrete patterns

- `package.json` (root): workspace scripts, `packageManager`, `lint-staged` config.
- `tsconfig.json` (root) and `packages/*/tsconfig.json`: TypeScript project boundaries.
- `packages/server/src/main.ts`, `packages/server/src/app.*`: server entrypoints and simple controller/service pattern.
- `packages/client/src/main.tsx`, `packages/client/src/App.tsx`: client entrypoints.
- `.eslintrc.cjs`, `.prettierrc`, `.prettierignore`: lint/format rules the agent must follow.
- `.husky/pre-commit` and `lint-staged` configuration in `package.json`.
- `.github/workflows/lint.yml`: CI behavior (Bun installation, `bun install --frozen-lockfile`, lint/format checks).

Safety & commit etiquette for agents

- Only make commits, allow user to decide when to push.
- Do not make commits that modify dependencies without updating and committing the lockfile.
- Run `bun run lint` and `bunx prettier --check .` in CI-like order locally before creating PRs.
- Keep changes small and focused; include a brief commit message and describe the intent in the PR body.

If any instruction above is unclear or seems out-of-date, reply with the file or behavior you want clarified and I will re-scan and iterate.
