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
│   ├── access/          # Access control & RBAC predicates (e.g., isAdmin, ownerFilter)
│   ├── app/             # Next.js App Router ((frontend) routes, (payload) admin)
│   ├── collections/     # Payload collection definitions (Products, Brands, Users, etc.)
│   ├── components/      # UI components & custom Payload admin UI fields
│   ├── endpoints/       # Custom API handlers & seed scripts (endpoints/seed/index.ts)
│   ├── utilities/       # Pure helper functions, formatters, and data shapers
│   ├── payload.config.ts# Payload CMS configuration
│   ├── payload-types.ts # Auto-generated TypeScript types
│   └── declarations.d.ts# Global type declarations
├── tests/
│   ├── unit/            # Vitest unit tests for utilities & logic
│   ├── integration/     # Vitest integration tests for Payload collections & APIs
│   ├── e2e/             # Playwright end-to-end tests
│   └── int/             # Payload test harness integration tests
├── scripts/             # Standalone maintenance and migration scripts
└── package.json
```

---

## Code Conventions & Best Practices

### 1. Simplicity & Scalability
- Prefer simple, direct, readable implementations over complex abstractions or deep inheritance layers.
- Avoid unnecessary wrapper functions or premature architectural bloat.

### 2. File Placement Rules
- **Access Control (`src/access/`)**: All reusable access control functions for collections and fields belong here.
- **Collections (`src/collections/`)**: Keep collection configurations modular and clean. Reusable access control belongs in `src/access/`, and business logic helpers belong in `src/utilities/`.
- **Utilities (`src/utilities/`)**: Generic and catalog-specific helpers (e.g. data normalization, discount calculations, product payload shaping) must be pure functions where possible.
- **Endpoints (`src/endpoints/`)**: Endpoints and seed routines belong here.
- **Components (`src/components/`)**: Custom UI components and admin field components belong here.

### 3. Imports & Aliases
- Use the `@/*` alias for all imports mapped to `src/*` (e.g., `import { isAdmin } from '@/access/isAdmin'`, `import { normalizeLabel } from '@/utilities/normalize'`).

### 4. Testing & Verification
- Test all pure utilities with unit tests under `tests/unit/`.
- Test collection lifecycle hooks, access control, and API responses under `tests/integration/`.
- Run tests via `npm run test:int` and verify types with `npx tsc --noEmit`.

---


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
