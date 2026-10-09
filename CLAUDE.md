# Project Guidelines & Architecture

## Overview

This project is an E-commerce CMS built with **Payload CMS 3.x**, **Next.js (App Router)**, and **MongoDB**.

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

---

## Folder Structure & Organization

The codebase follows the organizational pattern used by the official Payload Ecommerce Template to maintain simplicity and scalability without unnecessary complexity:

```
ecommerce-cms/
├── src/
│   ├── access/          # Access control & RBAC predicates (isAdmin, ownerFilter, productAccess)
│   ├── app/
│   │   ├── (frontend)/
│   │   │   ├── api/storefront/  # Public storefront REST routes (products, categories, tags)
│   │   │   ├── globals.css      # Plain CSS for frontend pages
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── (payload)/   # Payload admin & API routes (auto-generated, don't edit)
│   ├── collections/
│   │   ├── accounts/
│   │   │   ├── users/
│   │   │   │   ├── fields.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── catalog/
│   │   │   ├── brands/       # fields.ts, hooks.ts, index.ts
│   │   │   ├── categories/   # fields.ts, hooks.ts, index.ts
│   │   │   ├── products/     # fields.ts, hooks.ts, index.ts
│   │   │   ├── tags/         # fields.ts, hooks.ts, index.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── components/      # Custom Payload admin UI fields (e.g. ProductAttributesField)
│   ├── endpoints/       # (create when needed) Custom Payload endpoints & seed scripts
│   ├── utilities/       # Pure helper functions, formatters, and data shapers
│   ├── payload.config.ts# Payload CMS configuration
│   └── payload-types.ts # Auto-generated TypeScript types (`npm run generate:types`)
├── tests/
│   ├── unit/            # Vitest unit tests for utilities & logic
│   ├── integration/     # Vitest integration tests for Payload collections & APIs
│   ├── e2e/             # Playwright end-to-end tests
│   ├── int/             # Payload test harness integration tests
│   └── helpers/         # Shared test helpers (login, seed user)
├── scripts/             # (create when needed) Standalone maintenance and migration scripts
└── package.json
```

---

## Code Conventions & Best Practices

### 1. Simplicity & Scalability

- Prefer simple, direct, readable implementations over complex abstractions or deep inheritance layers.
- Avoid unnecessary wrapper functions or premature architectural bloat.

### 2. File Placement Rules

- **Access Control (`src/access/`)**: All reusable access control functions for collections and fields belong here.
- **Collections (`src/collections/`)**: Organize collection folders by their Payload admin group (for example, `accounts/users/` and `catalog/products/`). Keep each collection's `admin.group` label aligned with its parent group (`Accounts` or `Catalog`). Each collection's `index.ts` contains its slug, admin configuration, access control, and references to its fields and hooks. Keep field definitions in `fields.ts` and lifecycle hooks in `hooks.ts`; add these files only when needed. Group-level `index.ts` files export collection configs, while `src/collections/index.ts` provides the collection array consumed by `payload.config.ts`. Reusable access control belongs in `src/access/`, and shared business logic belongs in `src/utilities/`.
- **Utilities (`src/utilities/`)**: Generic and catalog-specific helpers (e.g. data normalization, discount calculations, product payload shaping) must be pure functions where possible.
- **Endpoints (`src/endpoints/`)**: Custom Payload endpoints and seed routines belong here. Public storefront routes live in `src/app/(frontend)/api/storefront/`.
- **Components (`src/components/`)**: Custom admin field components belong here.

### 3. Imports & Aliases

- Use the `@/*` alias for all imports mapped to `src/*` (e.g., `import { isAdmin } from '@/access/isAdmin'`, `import { normalizeLabel } from '@/utilities/normalize'`).

### 4. Styling

- This is a backend/CMS project: **no Tailwind, shadcn/ui, or other CSS frameworks**. Don't add them.
- Frontend pages use plain CSS in `src/app/(frontend)/globals.css` (simple BEM-style class names).
- Custom admin components use inline styles or plain CSS built on Payload's `--theme-*` CSS variables so they follow the admin theme.
- Keep the `sass` dependency: `@payloadcms/ui` ships `.scss` files that Next.js compiles at build time. Don't write `.scss` files of our own.

### 5. Hooks

- Throw `new APIError(message, 400)` (from `payload`) for user-facing validation errors. Plain `Error` becomes a 500, and Payload hides its message outside debug mode.
- Pass `req` to every nested Payload operation inside a hook (`req.payload.find({ ..., req })`) so it runs in the same transaction.

### 6. Testing & Verification

- Test all pure utilities with unit tests under `tests/unit/`.
- Test collection lifecycle hooks, access control, and API responses under `tests/integration/`.
- Run tests via `npm run test:int` and verify types with `npx tsc --noEmit`. Run `npm run build` after dependency changes.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
