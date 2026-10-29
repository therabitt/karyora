# AGENTS.md
# Karyora: AI Coding Agent Rulebook

> **Authority:** This file defines the mandatory implementation, security, data-integrity, accessibility, and quality rules for AI coding agents working in the Karyora repository.
>
> **Architecture baseline:** The implementation target is the architecture specified in `Artloom_Blueprint_v0.11_Final.md`, adapted to the currently selected product name, Karyora. The blueprint is the source of truth for product scope and detailed behavior unless an explicit, reviewed decision supersedes it.
>
> **Non-negotiable principle:** Never trade security, data integrity, privacy, or correctness for convenience, fewer files, shorter code, visual polish, or implementation speed.
>
> These rules apply to every change, including prototypes, refactors, migrations, scripts, tests, temporary fixes, and supposedly small UI adjustments.

---

# 1. Instructions for Every AI Agent

## 1.1 Mandatory operating procedure

Before changing code, the agent MUST:

1. Read this `AGENTS.md` completely.
2. Read `README.md` and inspect the actual repository tree.
3. Read `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, and `eslint.config.mjs` before making assumptions about versions, scripts, compiler settings, image configuration, or linting behavior.
4. Inspect the relevant existing source files before creating or modifying them.
5. Consult `docs/` for the applicable blueprint, architecture decisions, database design, and implementation notes. Before any public-facing visual/UI change, MUST read `docs/design/visual-direction.md` and follow its design principles and acceptance criteria. Treat that brief as the project's explicit visual preference record, not optional inspiration.
6. Identify whether the change affects authentication, authorization, database access, Storage, image processing, inquiry integrity, public caching, accessibility, or environment configuration.
7. Follow the existing architecture and the rules in this document.
8. Determine which tests, static checks, and manual verification are necessary for the change.
9. Make the smallest coherent change that completely satisfies the task.
10. Run the relevant checks that are supported by the installed project configuration.
11. Report what changed, what was verified, what was not verified, and any remaining limitations.

**The agent MUST NOT:**

- Assume that a file, package, component, script, migration, or feature exists just because it appears in the target architecture.
- Replace existing working code with generated boilerplate without inspecting it.
- invent package versions, npm scripts, environment variables, database columns, route contracts, or application behavior.
- claim that a test, type check, migration, deployment, or security review passed unless it actually ran and passed.
- treat successful compilation as proof of security or correctness.
- bypass architecture rules merely because a direct implementation appears shorter.
- make unrelated changes to improve personal preference or perceived elegance.
- delete user-created work, documentation, migrations, or configuration without an explicit technical reason and a safe recovery plan.
- hide an implementation compromise behind comments, placeholder code, mock data, or a successful-looking UI.

## 1.2 Mandatory language

The terms below have precise meanings throughout this document:

- **MUST / MUST NOT:** Mandatory. Violations are defects.
- **SHOULD / SHOULD NOT:** Expected practice. Deviations require a concrete reason and must not weaken a MUST-level requirement.
- **MAY:** Optional when compatible with all mandatory rules.

If two requirements appear to conflict, follow this order:

1. Security, privacy, and authorization.
2. Data integrity and recoverability.
3. The detailed blueprint and approved architecture decisions.
4. Functional correctness and accessibility.
5. Existing public and database contracts.
6. Maintainability and established repository conventions.
7. Visual preference and implementation convenience.

A lower-priority concern MUST NOT silently override a higher-priority requirement.

## 1.3 Required response when architecture is unclear

When an existing implementation or the blueprint does not provide enough information to make a safe change:

- Inspect the existing source, schema, tests, and documentation first.
- Reuse a documented decision if one exists.
- If the decision remains unresolved, isolate the uncertainty and choose the most conservative compatible implementation for reversible details.
- Do not guess at security-sensitive details.
- Do not add a new permission model, database field, state transition, public data field, or Storage lifecycle rule without recording the relevant decision.
- Identify any material assumption in the final change report.
- Do not invent academic submission requirements. The official assignment brief, rubric, and confirmed submission date must remain explicit unresolved items until supplied.

## 1.4 Existing code versus target architecture

The repository is expected to grow toward the target architecture in this document. That does not mean all target files already exist.

The previously observed repository baseline contained:

```text
karyora/
├── docs/
├── node_modules/
├── public/
├── src/
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

This inventory is a baseline observation, not a guarantee that the current tree has not changed.

The agent MUST inspect the actual tree before modifying it. Do not remove or rename existing files merely to make the tree match a proposed architecture diagram.

`node_modules/` and generated TypeScript build information are not application source files. Do not commit them unless an explicit, unusual repository requirement says otherwise.

---

# 2. Product Context and Scope

## 2.1 Product identity

The current product name is **Karyora**.

The supplied blueprint was created under the former name **Artloom**. It describes the same project. Do not treat Artloom and Karyora as two separate applications.

Use Karyora in user-facing copy, page metadata, project documentation, visual identity, and newly authored branding assets.

The blueprint uses the legacy environment-variable name `ARTLOOM_ADMIN_USER_ID`. For the Karyora implementation, standardize the corresponding configuration on `KARYORA_ADMIN_USER_ID`. Update its documentation, examples, and references consistently. Do not implement two competing aliases for the same administrator identity.

Do not perform a blind global replacement of `ARTLOOM` across security-sensitive identifiers, database history, or external configuration. Review each occurrence and migrate it deliberately.

## 2.2 Product definition

Karyora is a single-artist portfolio and commission-inquiry management web application.

It has two principal areas:

1. **Public portfolio:** Visitors browse the artist's work, view published artwork details, read the artist profile and commission information, inspect available offerings, and submit commission inquiries.
2. **Private administrator dashboard:** The provisioned artist-administrator manages artwork, image lifecycles, offerings, profile information, availability, and inquiry workflow.

The product is not a generic multi-tenant SaaS platform. Its authorization model is designed around one deliberately provisioned administrator.

## 2.3 Product boundaries

The MVP does not include:

- Customer accounts.
- Private client dashboards.
- Online payment collection.
- Contract signing.
- Direct client messaging.
- Multi-artist tenancy.
- Automatic booking guarantees.
- A claim that submitting an inquiry confirms or accepts a commission.

Do not add these features opportunistically. Scope expansion requires an explicit decision and assessment of its security, data-model, and academic-assignment implications.

A commission inquiry is a request for consideration, not a confirmed agreement.

## 2.4 Core product entities

The principal business entities are:

- `profiles`
- `artworks`
- `commission_offerings`
- `commission_inquiries`

The operational lifecycle also requires:

- `pending_uploads`
- `storage_cleanup_queue`
- `inquiry_rate_limits`

Supabase Auth owns authentication identities. Do not create a redundant `users`, `roles`, or `subscriptions` table for this MVP without a formally approved requirement.

---

# 3. Technology Stack and Dependency Rules

## 3.1 Required architectural stack

The intended stack is:

| Technology | Required role |
|---|---|
| Next.js 16 App Router | Application routing, layouts, Server Components, Server Actions, server-rendered public pages, and protected dashboard |
| React | UI components and interaction state |
| TypeScript | Static typing throughout application code |
| Tailwind CSS | Responsive layout and implementation of the named design tokens |
| Supabase Auth | Administrator identity and session |
| Supabase PostgreSQL | Relational data, constraints, indexes, migrations, guarded database operations, and persistent rate limiting |
| Supabase Storage | Private original images, public approved derivatives, signed uploads, and object deletion through the Storage API |
| Supabase JavaScript client | Typed access to configured Supabase services |
| Zod | Authoritative runtime validation of untrusted values and mutation inputs |
| Sharp | Server-side validation, orientation normalization, resizing, and metadata-stripping WebP generation |
| Vercel | Proposed application hosting target |

React Hook Form and shadcn/ui MAY be adopted where helpful, but neither is a security boundary or a requirement to restructure every form or component.

Lucide icons MAY be used for meaningful interface actions and statuses.

## 3.2 Dependency truth

`package.json` and `package-lock.json` are authoritative for the installed dependency set.

Before importing a package, the agent MUST verify that the dependency exists and is compatible with the installed framework.

The required architecture includes Zod and Sharp, but the agent MUST NOT assume they have already been installed merely because they are required.

If a mandatory dependency is missing:

1. Verify the intended package and compatible release.
2. Inspect the existing package manager and lockfile.
3. Add the dependency through the appropriate package manager.
4. Preserve the existing lockfile convention.
5. Verify the dependency tree and relevant application checks.
6. Do not upgrade unrelated dependencies without a need.

## 3.3 Package-manager rules

This repository has an npm lockfile, `package-lock.json`. Unless the repository deliberately changes package-manager strategy through a reviewed decision:

- Use npm.
- Preserve `package-lock.json`.
- Do not create `pnpm-lock.yaml` or `yarn.lock`.
- Do not mix package managers.
- Do not delete the lockfile to resolve a conflict.
- Do not regenerate the entire dependency tree merely to silence an unrelated warning.
- Do not use `--force` to override dependency resolution without a formally justified and reviewed migration plan.

**Never execute `npm audit fix --force`.**

Do not blindly approve blocked package install scripts. Inspect the dependency, its role, package provenance, version, and required build behavior before deciding whether a script should be allowed.

Security audit output MUST be inspected and interpreted rather than treated as a command to apply the most aggressive automated fix.

## 3.4 Application architecture

Karyora uses a single-repository, full-stack Next.js architecture.

The Next.js application contains:

- Public page rendering.
- Administrator dashboard rendering.
- Server-side data access.
- Authentication verification.
- Authorization boundaries.
- Server Actions.
- Runtime input validation.
- Image validation and derivative generation.
- Publication and cleanup orchestration.

Supabase provides managed database, authentication, and Storage services.

Do not introduce a separately deployed Express, NestJS, FastAPI, or other backend merely to organize a small number of operations. A separate service requires an approved architectural change.

Do not place database queries and privileged business logic indiscriminately inside UI components. Keep domain-specific operations in server-side modules that can be reviewed and tested independently.

---

# 4. Repository Structure and Module Boundaries

## 4.1 Target application layout

The following is the intended organizational direction. Create files as features are implemented, not merely to make the tree look complete.

```text
karyora/
├── docs/
│   ├── README.md
│   ├── blueprint/
│   │   └── Artloom_Blueprint_v0.11_Final.md
│   └── decisions/
│       └── README.md
├── public/
│   ├── fonts/
│   └── static/
├── src/
│   ├── proxy.ts
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx
│   │   │   ├── artworks/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── commission/
│   │   │   │   └── page.tsx
│   │   │   ├── contact/
│   │   │   └── terms/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (admin)/
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── artworks/
│   │   │       ├── offerings/
│   │   │       ├── commissions/
│   │   │       └── settings/
│   │   ├── actions/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── gallery/
│   │   ├── artwork/
│   │   ├── commissions/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── browser.ts
│   │   │   ├── server.ts
│   │   │   ├── service.ts
│   │   │   └── proxy.ts
│   │   ├── auth/
│   │   ├── data/
│   │   ├── storage/
│   │   ├── validation/
│   │   ├── rate-limit/
│   │   └── utils/
│   └── types/
│       ├── database.types.ts
│       └── domain.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed.sql
│   └── tests/
├── scripts/
│   ├── seed-demo.ts
│   └── cleanup-storage.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

The exact route files and optional modules MUST be verified against the actual code before being added or referenced.

Next.js route groups such as `(public)`, `(auth)`, and `(admin)` organize files without adding the group name to the URL.

## 4.2 Module responsibilities

- `src/app/`: Routes, layouts, loading boundaries, error boundaries, not-found responses, and route-level orchestration.
- `src/app/actions/`: Server Actions with narrowly defined mutation contracts.
- `src/components/ui/`: Reusable, accessible primitives.
- `src/components/layout/`: Public and dashboard shells.
- `src/components/gallery/`: Public gallery presentation.
- `src/components/artwork/`: Artwork forms, previews, and administration UI.
- `src/components/commissions/`: Public offerings, inquiry form, and inquiry workflow UI.
- `src/components/dashboard/`: Dashboard-specific views and operational widgets.
- `src/lib/supabase/`: Separate browser, cookie-aware server, privileged service, and session-refresh helpers.
- `src/lib/auth/`: Session verification, administrator authorization, and access-denied behavior.
- `src/lib/data/`: Typed, task-specific database-access functions.
- `src/lib/storage/`: Signed upload, image finalization, publication, replacement, deletion, and cleanup orchestration.
- `src/lib/validation/`: Reusable Zod schemas and parsed domain inputs.
- `src/lib/rate-limit/`: Persistent shared rate limiting for inquiry submission.
- `src/lib/utils/`: Non-domain-specific utilities.
- `src/types/`: Generated database types and carefully defined application/domain types.
- `supabase/migrations/`: Version-controlled schema, grant, policy, trigger, index, and function changes.
- `supabase/tests/`: Database behavior and security tests where practical.
- `scripts/`: Explicitly authorized maintenance tasks, repeatable seeding, and Storage cleanup.

Do not merge browser code, privileged database access, authorization, and Storage lifecycle code into a single catch-all file.

## 4.3 Naming conventions

Use the following conventions consistently:

| Item | Convention | Example |
|---|---|---|
| React components | PascalCase | `ArtworkCard.tsx` |
| Component modules | Match exported component name where practical | `ArtworkCard.tsx` |
| Route files | Next.js conventional lowercase names | `page.tsx`, `layout.tsx` |
| Utility and data modules | kebab-case | `artwork-data.ts` |
| Validation modules | kebab-case | `artwork-schema.ts` |
| Hook functions | camelCase with `use` prefix | `useArtworkFilters` |
| Functions and variables | camelCase | `publishArtwork` |
| TypeScript types and interfaces | PascalCase | `ArtworkRecord` |
| Zod schemas | camelCase with a descriptive schema suffix | `artworkInputSchema` |
| Database tables and columns | snake_case | `commission_inquiries`, `admin_notes` |
| SQL migration files | Timestamp-prefixed, descriptive lowercase names | `YYYYMMDDHHMMSS_add_artworks_indexes.sql` |
| Environment variables | UPPER_SNAKE_CASE | `KARYORA_ADMIN_USER_ID` |
| CSS custom properties | Lowercase semantic tokens | `--color-paper` |

Follow established names where they are already part of a public contract, database schema, generated type, or documented API. Do not rename code just to satisfy a stylistic preference.

---

# 5. Server and Client Component Boundaries

## 5.1 Server Components are the default

Every page and component MUST remain a Server Component by default.

Use Server Components for:

- Public page composition and rendering.
- Server-side public data reads.
- Dashboard page composition after authorization.
- Reading protected data through authorized server modules.
- Rendering forms and controls that do not require browser-side state.
- Metadata and route-level server behavior.

Do not add `"use client"` simply because a component renders HTML, accepts props, uses Tailwind CSS, or contains a normal anchor link.

## 5.2 Client Components require a concrete need

A component MAY use `"use client"` when it requires actual client-side functionality, such as:

- React state or effects.
- Interactive gallery filters that are intentionally client-side.
- File selection and local upload-progress feedback.
- Browser-only APIs.
- Interactive dialogs, menus, or complex form controls.
- Other explicitly justified browser interactions.

Keep the client boundary as low in the component tree as practical.

Do not convert an entire route or layout to a Client Component just to support a small interactive element.

## 5.3 Forbidden Client Component behavior

A Client Component MUST NOT:

- Import a server-only privileged Supabase module.
- Access secret environment variables.
- Execute server-only Sharp processing.
- Receive a Supabase service-role or secret key through props.
- Perform administrator writes using the browser client.
- Directly read or write protected inquiry records.
- Treat a client-provided ID, role, or hidden field as proof of authorization.
- Expose private Storage paths or signed download URLs to public page content.
- Perform authoritative validation that replaces server-side Zod validation.

## 5.4 Server Actions

A Server Action is a remotely invocable server operation, not an ordinary private function.

Every Server Action MUST:

1. Declare and use the appropriate server execution boundary.
2. Accept only a narrow, explicit input contract.
3. Parse untrusted input with Zod on the server.
4. Verify authorization according to the operation.
5. Apply domain invariants and current-state checks.
6. Invoke only the task-specific data-access function needed.
7. Handle database and Storage errors safely.
8. Return a deliberate, serializable result.
9. Revalidate or redirect only after the authoritative operation succeeds.
10. Avoid leaking privileged records, internal identifiers, or server implementation details.

The function being imported only by a dashboard component does not make it protected.

The fact that a page layout checks the user does not make its Server Actions protected.

## 5.5 Next.js 16 request boundary

Use the Next.js 16 request-proxy convention represented by `src/proxy.ts` when session refresh and cookie propagation require it.

Do not blindly transplant older `middleware.ts` examples into this project.

The proxy/session-refresh layer is not the authorization boundary. It MAY refresh authentication cookies and perform optimistic navigation behavior, but protected operations must verify identity independently.

Use the APIs compatible with the installed Next.js version. Confirm framework-specific APIs against the installed version and its official documentation before adopting a pattern from an older tutorial.

---

# 6. Supabase Client Boundaries

## 6.1 Browser/publishable client

The browser client MUST use the public publishable/anonymous credential intended for browser use.

Its permitted responsibilities are deliberately narrow:

- Public, allowlisted data access under the configured policies.
- Browser-side interactions that use explicitly authorized public data.
- Uploading bytes to the exact staged object path using a server-issued signed upload URL.

It MUST NOT perform generic administrator writes, issue upload authorization, create public image derivatives, publish artwork, unpublish artwork, read the inquiry inbox, mutate inquiry status or notes, or delete privileged assets directly.

Do not create one universal Supabase client module that is imported indiscriminately by browser and server code.

## 6.2 Cookie-aware server session client

The ordinary server client MUST use the supported server-side session/cookie integration.

Use it for:

- Reading the authenticated identity.
- Verifying the current user through Supabase Auth.
- Performing deliberately user-scoped operations subject to the intended database grants and RLS policies.
- Any operation whose design specifically requires the authenticated user's database permissions.

Authentication checks MUST verify the current user on the server. Do not treat an unverified session object or stale client-side authentication state as proof of identity.

When checking user identity, use the supported server-side Auth verification flow, including `auth.getUser()` where required by the blueprint.

## 6.3 Server-only privileged client

The privileged client belongs in a server-only module such as `src/lib/supabase/service.ts`.

It MAY perform narrowly defined privileged operations, including:

- Authorized administrator mutations.
- Issuance of exact-path signed upload URLs.
- Validated public inquiry creation.
- Protected status and administrator-note updates.
- Publication, replacement, unpublishing, and deletion orchestration.
- Approved cleanup queue processing.

Every import path and exported operation must preserve the privileged boundary.

The module SHOULD enforce server-only import restrictions supported by the installed Next.js environment.

Do not expose a generic privileged client to browser components or return it from a general-purpose helper.

## 6.4 Secrets

The following rules are absolute:

- `SUPABASE_SERVICE_ROLE_KEY` MUST NEVER be stored in a `NEXT_PUBLIC_*` variable.
- A Supabase secret key MUST NEVER enter a client bundle.
- Do not pass server secrets into Client Components.
- Do not return secret credentials from Server Actions.
- Do not put credentials in URLs, logs, source control, screenshots, committed examples, or error messages.
- Do not treat obfuscated names, hidden form inputs, runtime flags, or client-side checks as secret protection.
- `.env.example` MUST contain placeholders only, never real credentials.
- `.env.local` MUST remain outside version control.

Use the environment-variable name already deliberately adopted by the repository, and update documentation consistently if it changes. Never silently maintain two different secrets for the same purpose.

## 6.5 Authorization must precede privileged access

A privileged client bypasses ordinary RLS enforcement. The agent MUST NOT treat the existence of RLS as sufficient authorization for a privileged server operation.

For administrator operations, the required sequence is:

1. Receive the request.
2. Verify the live Supabase Auth user on the server.
3. Confirm the user ID matches `KARYORA_ADMIN_USER_ID`.
4. Verify the server-controlled administrator role, using the configured role model such as `app_metadata.role = 'admin'`.
5. Reject missing users, wrong identities, wrong roles, authentication errors, or invalid administrator configuration.
6. Validate the operation payload with Zod.
7. Invoke a narrow privileged data-access function.
8. Return a safe result after the actual persistence outcome is known.

If `requireAdmin()` fails, the privileged helper MUST NOT be called.

There MUST NOT be a fallback from failed authentication to service-role execution.

A valid authenticated user who is not the configured administrator remains unauthorized.

## 6.6 `requireAdmin()` is mandatory

Implement and reuse one authoritative `requireAdmin()` boundary.

Every protected Server Action MUST call `requireAdmin()` itself before performing privileged work.

Apply the same principle to:

- Protected Route Handlers.
- Private data-access entry points exposed to request handlers.
- Upload URL issuance.
- Upload finalization.
- Artwork metadata mutations.
- Artwork publication, replacement, unpublishing, and deletion.
- Profile and commission-offering mutations.
- Inquiry inbox access and status/note mutations.
- Cleanup retry operations.

Do not rely on dashboard layout protection, proxy redirects, CSS, hidden buttons, or client routing.

Do not permit arbitrary authenticated users to become administrators through profile editing, public signup, `user_metadata`, query parameters, cookies controlled by the client, hidden fields, or a supplied UUID.

Only the deliberate server-controlled provisioning process may grant administrator privileges.

## 6.7 Public inquiry submission is the explicit exception

Public inquiry creation is allowed without administrator authentication, but it MUST be implemented as a constrained, protected server workflow.

It is not permission for public database inserts.

The public visitor must not receive direct database `INSERT` permission on `commission_inquiries`.

The action MUST enforce all public-submission safeguards defined in Sections 8 and 12 of this document.

---

# 7. Zod Validation Requirements

## 7.1 Zod is mandatory for untrusted inputs

Every form submission and every mutation payload MUST be validated with Zod on the server before it reaches the database or a privileged operation.

This includes:

- Login input.
- Artwork creation.
- Artwork metadata updates.
- Slug changes.
- Image upload initialization.
- Upload finalization.
- Publication and unpublishing operations.
- Image replacement.
- Artwork deletion.
- Commission-offering creation and updates.
- Offering deactivation.
- Profile updates.
- Availability changes.
- Public inquiry creation.
- Inquiry status transitions.
- Administrator-note updates.
- Cleanup retry requests.
- Any Route Handler or other request boundary accepting external data.

Validation applies even if a browser form already validates the same fields.

## 7.2 Browser validation does not replace server validation

Client-side validation exists to improve user experience. It is not authoritative.

The server MUST validate the data again because a caller can invoke a Server Action directly, bypass the UI, submit stale values, or forge a request.

A successful HTML form validation event does not establish that the submitted input is valid.

TypeScript interfaces and compile-time types do not validate runtime input.

## 7.3 Schema design

Zod schemas MUST be specific to the operation they authorize.

Prefer separate schemas for:

- Artwork creation metadata.
- Artwork metadata updates.
- Explicit slug changes.
- Image upload initialization.
- Inquiry submissions.
- Inquiry status transitions.
- Administrator-note updates.
- Commission-offering changes.
- Profile and availability settings.

Do not use one enormous generic schema that permits callers to submit arbitrary database columns.

Use explicit allowlists. Reject or safely ignore unexpected fields according to the schema's defined strictness policy. Security-sensitive operations must not silently accept client-supplied protected properties.

A public form MUST NOT be able to choose authoritative values such as:

- `status`.
- `admin_notes`.
- `submitted_at`.
- `availability_at_submission`.
- Offering title snapshots.
- Owner IDs.
- Publication timestamps.
- Private or public Storage paths.
- Internal cleanup fields.
- Administrator role or permission fields.

The server must derive these values from the validated current state and documented domain rules.

## 7.4 Validation layers

Use the appropriate combination of:

1. UI validation for immediate, accessible feedback.
2. Server-side Zod validation for every untrusted request.
3. Database constraints for invariants that must hold regardless of application path.

Database constraints remain necessary for foreign keys, uniqueness, non-null fields, status values, non-negative monetary values, valid publication state, and other database-level invariants.

Do not use the absence of a field-level error in the UI as a reason to weaken the server schema.

---

# 8. Public Commission Inquiry Security

## 8.1 Submission architecture

All public commission inquiries MUST be created through the designated secure Server Action.

Public submission MUST NOT be implemented as:

- A browser client calling `supabase.from('commission_inquiries').insert(...)`.
- A public Route Handler accepting arbitrary database columns.
- A direct public PostgreSQL insert.
- A generic endpoint exposing the privileged client.
- A client-side mutation followed by a visual success message.
- A mutation that trusts the form's availability state or offering title.

The Server Action must pass only validated, explicitly allowed values to a narrow server-only insertion function.

## 8.2 Required request sequence

Public inquiry creation MUST follow this sequence:

1. Receive the request.
2. Validate the allowlisted payload with Zod.
3. Check the honeypot field and reject a detected bot submission using the chosen safe response behavior.
4. Apply the mandatory shared PostgreSQL-backed rate limiter.
5. Re-read and, where required, lock or atomically verify the current commission availability state.
6. Reject submissions if commissions are currently Closed, even if the browser form was open when rendered.
7. Validate any selected offering against the current database record and active state.
8. Obtain the offering title snapshot from authoritative server-side data, not from the submitted title.
9. Derive `availability_at_submission` from the actual current authoritative availability.
10. Set server-owned values such as status and submission timestamp.
11. Insert the inquiry through the narrow server-only data-access operation.
12. Return only the minimum submission result needed by the public interface.

A stale page cannot override the current server-side Closed state.

If the rate limiter cannot be evaluated safely, reject the inquiry temporarily and log only a sanitized operational failure. Do not fail open.

## 8.3 Mandatory shared rate limiting

The rate limiter MUST be persistent and shared across serverless instances.

Use the PostgreSQL-backed design from the blueprint, with an atomic database operation and a persistent `inquiry_rate_limits` table.

The specified baseline is:

- Fixed 15-minute windows.
- A threshold of five attempts per 15-minute window.
- A server-computed keyed hash of the trusted client-network identifier.
- A composite key based on `(key_hash, window_start)`.
- An atomic PostgreSQL function that increments the counter and reports whether the threshold has been exceeded.
- Safe cleanup of expired rate-limit records.

Do not store the raw IP address as the rate-limit key when the design specifies a keyed hash.

Do not expose the hash key or its secret to browser code.

Do not use an in-memory JavaScript counter as the primary or only rate limiter. Process-local memory is not shared reliably across concurrent serverless invocations.

Do not implement a fallback that accepts inquiries if shared rate limiting fails.

## 8.4 Submission result minimization

A successful public submission response MUST NOT include:

- The administrator's notes.
- The entire saved inquiry object.
- Private administrator inbox data.
- Internal privileged record details unnecessary to the visitor.
- Storage or cleanup information.
- Server secrets.
- A stack trace or raw database error.

The public form should communicate only whether the request was accepted for consideration and any necessary next-step information.

Do not imply that the commission has been accepted.

---

# 9. Authentication and Session Rules

## 9.1 Single-administrator model

Only one deliberately provisioned artist-administrator is in scope.

Public signup MUST remain disabled.

The `/login` page must authenticate the configured account. It must not provide an open registration route or permit a visitor to grant themselves an administrator role.

Do not expose dashboard controls for creating a second administrator, assigning roles, or deleting the administrator identity.

## 9.2 Identity and role are separate

Keep these decisions distinct:

1. **Authentication:** Is there a valid authenticated identity?
2. **Application authorization:** Is this identity the configured Karyora administrator?
3. **Resource authorization:** Do database grants, RLS policies, function privileges, and Storage policies allow this specific access?

A signed-in user is not automatically an administrator.

A role claim supplied through user-editable metadata is not sufficient proof.

Use a server-controlled administrator role, such as `app_metadata.role = 'admin'`, when the configured role claim is enabled. The confirmed user ID must also match `KARYORA_ADMIN_USER_ID`.

## 9.3 Session refresh

Session-refresh code MUST follow the installed `@supabase/ssr` and Next.js APIs.

Cookie changes MUST be propagated correctly through the supported response mechanism.

Static assets and image assets SHOULD be excluded from unnecessary session-refresh work through the appropriate proxy matcher.

Do not copy an outdated Supabase SSR example without checking its current cookie adapter and Auth verification behavior.

## 9.4 Sign-out and revocation

Sign-out MUST terminate the supported Auth session, clear relevant cookie state, and redirect appropriately.

After sign-out, the next protected request must fail.

When the configured administrator is removed, replaced, or has their role revoked, protected operations must fail on the next verified request.

Do not rely exclusively on a stale role stored in client state.

If the administrator identity changes, update `KARYORA_ADMIN_USER_ID`, the profile linkage, and the related documentation deliberately and test authorization afterward.

## 9.5 MFA and password recovery

MFA is a documented SHOULD feature under the blueprint and may depend on assignment scope. If omitted, document the omission honestly.

If MFA is implemented, use the provider's supported assurance flow for administrator operations.

MFA does not replace `requireAdmin()`, RLS, database constraints, function grants, or Storage policies.

Password recovery MUST NOT create another account or grant a different user administrator access. Never log or commit recovery tokens.

---

# 10. PostgreSQL, Migrations, and Authorization

## 10.1 Migrations are the schema source of truth

All schema changes MUST be represented in version-controlled SQL migrations.

This includes:

- Tables and columns.
- Defaults and constraints.
- Primary and foreign keys.
- Uniqueness rules.
- Indexes.
- RLS policies.
- Table and column grants.
- Function privileges.
- Database functions.
- Triggers.
- Search-vector maintenance.
- Upload and cleanup coordination.
- Inquiry immutability.
- Inquiry transition guards.
- Shared rate-limit logic.

Do not rely on undocumented manual changes in the Supabase dashboard.

Do not introduce an ORM solely for convenience without an approved architecture decision. The baseline uses Supabase's typed client and SQL migrations.

Every migration MUST be reviewed for both the desired behavior and the effective permissions it leaves behind.

## 10.2 Database roles, grants, and RLS

RLS is a defense-in-depth layer. It is not a substitute for authorization in privileged Server Actions.

Every exposed table must have deliberate grants and appropriate RLS policies.

The agent MUST distinguish:

- Table-level privileges.
- Column-level privileges.
- Row-level security.
- Database function `EXECUTE` privileges.
- View security behavior.
- Storage object policies.
- Privileged service-role access.

Do not assume that enabling RLS automatically prevents every unauthorized query.

Do not assume RLS filters columns. RLS controls rows; column-level permissions are required where field-level restrictions matter.

Do not leave default or broad function execution privileges in place without deliberate review.

For any `SECURITY DEFINER` function that is genuinely required:

- Keep it narrowly scoped.
- Restrict execution to the exact intended roles.
- Use a pinned trusted `search_path` where applicable.
- Avoid dynamic SQL unless properly constrained.
- Verify effective privileges through direct tests.
- Document why privileged execution is necessary.

`SECURITY INVOKER` alone does not neutralize the power of a service-role caller.

PostgreSQL table-level `REVOKE` operations can also revoke column privileges; reason about effective grants rather than assuming independent privilege layers will remain unchanged.

## 10.3 Public projections

Public page queries MUST return only the fields required by the public UI.

Public content access must exclude:

- Draft artwork.
- Administrator notes.
- Inquiry records.
- Pending upload records.
- Rate-limit records.
- Cleanup queue contents.
- Internal administrator IDs.
- Private original image paths.
- Other private operational values.

Use explicit field selection and safe public projections.

Do not rely on a hidden UI element to protect data that the query has already returned.

## 10.4 Published artwork filtering

Every public artwork read MUST filter to Published artwork using the authoritative database state.

A guessed slug, forged URL, direct request, or query parameter MUST NOT reveal a Draft artwork's title, description, image path, or publication state.

Draft and nonexistent public slugs must produce a safe not-found result.

Public image URLs must be derived from `public_image_path`, never from `private_image_path`.

## 10.5 Schema and history protection

The profile is linked to the administrator identity.

Artwork and commission offerings belong to the profile. Preserve these relationships through foreign keys and appropriate delete restrictions.

A commission offering referenced by existing inquiries should be deactivated rather than hard-deleted. Preserve historical meaning through the saved `offering_title_snapshot`.

Database state transitions and immutability rules must remain valid even when someone bypasses the expected UI and attempts a direct database/API operation.

## 10.6 Search-vector rule

If artwork search uses PostgreSQL full-text search, follow the blueprint's trigger-maintained search-vector design.

Do not use a generated column expression that depends on non-immutable functions, including the previously identified problematic use of `array_to_string(tags, ' ')`.

Use a reviewed trigger or another explicitly approved and migration-tested approach.

Search behavior must be tested for empty and punctuation-only queries, accents, prefixes, bound parameters, and index usage where applicable.

Never concatenate untrusted search input into raw SQL.

---

# 11. Commission Inquiry Integrity

## 11.1 Original submission fields are immutable

The following original submission fields MUST NOT be modified through ordinary administrative updates:

- `client_name`
- `client_email`
- `offering_id`
- `offering_title_snapshot`
- `description`
- `budget_amount`
- `budget_currency`
- `desired_deadline`
- `availability_at_submission`
- `submitted_at`

These values represent what the client submitted and the state recorded at submission time.

An administrator cannot rewrite the original request in place. If a client later clarifies something through an external conversation, record that clarification in `admin_notes` while preserving the original submission.

Karyora does not provide a client account or submission-editing portal in the MVP.

## 11.2 Allowed mutable inquiry fields

The only ordinary mutable fields are:

- `status`
- `admin_notes`
- System-managed `updated_at`

Protect these rules at the database boundary, not merely in TypeScript or the UI.

## 11.3 Database-enforced immutability

MUST requirements:

- Implement a `BEFORE UPDATE` trigger that rejects changes to the immutable original submission fields.
- Apply the trigger even to writes attempted through a privileged server path.
- Revoke broad update access.
- Permit only the intended `status`, `admin_notes`, and system-managed `updated_at` update path.
- Ensure the privileged client cannot bypass the trigger's immutability guarantee.
- Test direct update attempts against every protected field.
- Do not rely on the browser omitting immutable fields.

## 11.4 Inquiry status transitions

Only the following status transitions are permitted:

| Current status | Allowed next status |
|---|---|
| `new` | `reviewing`, `accepted`, `declined` |
| `reviewing` | `accepted`, `declined` |
| `accepted` | `reviewing`, `declined`, `completed` |
| `declined` | `reviewing` |
| `completed` | `accepted` |

Every other transition MUST be rejected.

In particular, an inquiry MUST NOT return to `new` after it has been moved out of that state.

This rule preserves the meaning of the New inquiry count.

## 11.5 Atomic transition enforcement

A status transition MUST be validated against the current stored status, not the status that was displayed in the browser.

Implement the transition through a guarded database function or an equivalent single, atomic database mutation.

Do not implement a vulnerable read-check-update sequence in which concurrent requests can both believe they changed the same previous status.

Test the full allowed and denied transition matrix.

## 11.6 Inquiry access and output

The public browser MUST NOT query the inquiry table directly.

Administrator inbox reads and mutations MUST pass through authorized server-side access functions.

Public projections MUST NEVER include the inquiry table, inquiry notes, or related private data.

Do not return a full inquiry row from a public submission action.

---

# 12. Image Processing and Storage Lifecycle

## 12.1 This pipeline is mandatory

All source images MUST pass through the validated image lifecycle before they can be published.

The original image is a private source asset. The public image is a generated derivative.

**NEVER upload a source original directly into a public bucket.**

**NEVER copy the source bytes into a public bucket.**

**NEVER publish an uploaded file based only on the filename, extension, browser MIME type, or reported dimensions.**

Use Sharp on the server for actual image inspection, orientation normalization, resizing, WebP re-encoding, and metadata removal.

## 12.2 Allowed input formats

The source input formats are limited to:

- JPEG.
- PNG.
- WebP.

Reject unsupported file types.

Reject corrupt image data, misleading MIME declarations, signature mismatches, and prohibited animated or multi-frame content.

A filename such as `photo.webp` does not prove that the bytes are a valid WebP image.

Treat browser-supplied MIME types and filenames as untrusted metadata.

## 12.3 Exact source limits

Every upload MUST satisfy all of these requirements:

| Constraint | Mandatory limit |
|---|---:|
| Maximum source size | 5 MiB, exactly 5,242,880 bytes |
| Maximum width | 4,000 pixels |
| Maximum height | 4,000 pixels |
| Maximum pixel area | 16,000,000 pixels |
| Allowed input | JPEG, PNG, WebP |
| Animated/multi-frame input | Reject |
| Corrupt input | Reject |

Enforce the byte limit in the UI for immediate feedback, at the Storage bucket level where supported, and again on the server after the upload.

Never trust the browser's size value as the final size check.

## 12.4 Validate metadata before decoding pixels

Before fully decoding untrusted image data:

1. Use Sharp's metadata inspection.
2. Determine the actual format and source dimensions.
3. Account for EXIF orientation when evaluating effective width and height.
4. Reject dimensions over the 4,000-pixel edge limit.
5. Reject images above 16,000,000 pixels total.
6. Reject prohibited animation or multi-frame content.
7. Reject corrupt or unsupported input.
8. Construct the Sharp pipeline with `limitInputPixels: 16_000_000`.
9. Use strict decoder failure handling, including `failOn: "warning"` where supported by the installed Sharp version.
10. Handle decoder exceptions without exposing raw internal errors to the client.

These limits exist to reduce decompression-bomb and resource-exhaustion risk.

Do not decode arbitrary uploaded images without resource limits.

## 12.5 Required Sharp processing

Public images MUST be generated from the validated private source through Sharp.

The pipeline MUST:

1. Read the validated private source bytes.
2. Verify the decoded input is permitted.
3. Apply EXIF orientation to the actual pixels using `.rotate()`.
4. Resize within the documented dimensions without enlarging smaller images.
5. Re-encode as WebP.
6. Remove source metadata using `.withoutMetadata()`.
7. Generate the public destination path on the server.
8. Upload the generated bytes through the Supabase Storage API.
9. Use `image/webp` as the output content type.
10. Verify the generated output's format and dimensions before committing publication state.
11. Ensure no EXIF/GPS/location, XMP, IPTC, or other source metadata is exposed.
12. Retain the original only in private Storage.

Do not call metadata-preserving methods such as `.withMetadata()`, `.withExif()`, or `.keepMetadata()` for public derivatives.

Do not assume that converting an image to WebP automatically proves all sensitive source metadata has been removed. Verify the output behavior.

A conceptual pipeline is:

```ts
const output = await sharp(sourceBuffer, {
  limitInputPixels: 16_000_000,
  failOn: "warning",
})
  .rotate()
  .resize({
    width: 1600,
    height: 1600,
    fit: "inside",
    withoutEnlargement: true,
  })
  .webp({ quality: 82 })
  .withoutMetadata()
  .toBuffer();
```

This example describes the required processing sequence for an artwork derivative. It is not permission to skip the preceding source validation, metadata inspection, dimension enforcement, Storage workflow, or output verification.

Verify the method chain against the installed Sharp version and keep the actual quality setting centralized and documented. Never remove `.withoutMetadata()`.

## 12.6 Public artwork derivative

A published artwork derivative MUST remain within:

- 1,600 × 1,600 pixels.
- WebP output format.
- No source metadata.
- A unique, versioned destination path.
- The approved public artwork bucket, `artworks-public`.

The original MUST remain private.

Use versioned paths. Do not overwrite the existing published image in place. The new path must be committed as authoritative only after its derivative and necessary database changes are ready.

Do not silently claim an image optimization or caching guarantee that has not been measured.

## 12.7 Profile avatar derivative

Profile avatar replacement follows the same private-source workflow.

Use:

- A private staged source upload.
- The `profile_avatar` purpose in the pending-upload lifecycle.
- Server-side validation of bytes, format, size, dimensions, and metadata.
- EXIF orientation normalization with `.rotate()`.
- A maximum 512 × 512 derivative, with the aspect ratio preserved and no enlargement.
- WebP output.
- An initial quality setting of 80, centralized so it can be adjusted deliberately.
- `.withoutMetadata()`.
- A unique, versioned destination path in `profiles-public`.
- A rollback cleanup intent before uploading the new derivative.
- A guarded transaction for `profiles.avatar_path`.

Never upload a profile avatar source directly to `profiles-public`.

After the new avatar is committed, queue the old public avatar and superseded private source for safe cleanup. Do not remove the old avatar before the new authoritative reference is committed.

## 12.8 Direct-to-Storage uploads

Do not send full artwork files through a Server Action request body or a Vercel Function upload handler.

The intended flow is:

1. The administrator selects a file in the browser.
2. A protected Server Action validates the upload request.
3. The server generates the private object path and creates a pending-upload record.
4. The server issues a signed upload URL limited to that exact path.
5. The browser uploads the source bytes directly to private Storage.
6. The server verifies and finalizes the staged upload.
7. Publication generates the public derivative using Sharp.
8. The authoritative database state is committed only after required assets are available.
9. Failed or abandoned uploads remain discoverable by the cleanup workflow.

Never let the browser choose an arbitrary bucket or object path for privileged uploads.

The blueprint assumes signed upload URLs may remain usable for two hours. Do not assume the provider token can be shortened to an arbitrary five-minute expiry.

The application's `pending_uploads.expires_at` rule and the provider's actual signed-token expiry are separate controls. Cleanup MUST respect the real token expiry and cleanup grace before deleting an unreferenced staged source.

An expired application deadline MUST prevent late finalization even if a signed upload URL is still technically usable.

## 12.9 Pending uploads

Every pending upload must be tied to its intended purpose, private object path, ownership context, lifecycle state, and expiry rules.

Do not accept arbitrary object paths or caller-supplied finalization values.

Finalization must verify the pending record and the actual stored bytes.

Do not finalize an object belonging to a different purpose, path, owner, or expired pending record.

Never mark a pending upload consumed or successful before its intended operation is durable.

If finalization fails, retain enough state for safe recovery or cleanup.

## 12.10 Unique image paths

Artwork replacement and publication MUST use unique versioned paths.

Never overwrite the currently active source or published derivative in place.

The old path remains authoritative until the new path and relevant database changes commit successfully.

Versioned paths reduce ambiguity caused by browser, CDN, and Next.js image-optimizer caching.

Do not use the public URL itself as the canonical database value. Store object paths and derive URLs from approved paths.

## 12.11 Publication flow

Publishing a Draft requires:

- Authorized administrator identity.
- Validated artwork metadata.
- A valid private source object.
- A validated WebP derivative.
- A server-generated unique public path.
- A rollback cleanup intent for the new derivative.
- A guarded database transaction.

Required sequence:

1. Call `requireAdmin()`.
2. Read the latest artwork state.
3. Validate the publication request with Zod.
4. Verify the private source and its pending-upload lifecycle.
5. Generate a versioned public derivative through the required Sharp pipeline.
6. Register rollback cleanup intent before derivative generation/upload as required by the lifecycle design.
7. Upload the derivative to `artworks-public`.
8. Lock and verify that the rollback cleanup intent remains `queued`.
9. In one guarded database transaction, set `status = 'published'`, set `published_at`, and commit `public_image_path`.
10. Preserve `is_featured` unless an explicit valid featured-state change is part of the operation.
11. Clear rollback intent as part of the successful commit.
12. Revalidate affected public data only after commit.
13. Show the UI success state only after the required operation is authoritative.

If derivative processing or upload fails, the artwork remains Draft.

If derivative upload succeeds but the database commit fails, keep a cleanup intent for the orphaned derivative.

If cleanup has already claimed the rollback intent, publication must abort. Do not commit a database reference to an object cleanup may delete.

## 12.12 Image replacement flow

When replacing a published or unpublished artwork image:

1. Preserve the old active image and paths.
2. Stage the new source as a new private object.
3. Validate the new source.
4. If the artwork is published, generate and validate a new public derivative.
5. Register a rollback cleanup intent for that new derivative.
6. Lock and check the rollback intent in the guarded database transaction.
7. Update the private path and, where applicable, the public path.
8. Preserve the Published state and publication timestamp when replacing the image of an artwork that remains Published.
9. Queue the old private and public objects for cleanup in the same database transaction as the path change.
10. Clear new-derivative rollback intent as part of the successful commit.
11. Keep the old image active if processing or the commit fails.
12. Revalidate affected views after commit.
13. Delete superseded assets only through the cleanup workflow.

If cleanup claims the new derivative's rollback row first, the replacement transaction MUST abort.

Never remove the old image before the new reference is authoritative.

## 12.13 Unpublish flow

Unpublishing MUST commit the database change first.

Required sequence:

1. Call `requireAdmin()`.
2. Re-read the current artwork state.
3. Validate the request and expected state.
4. In one database transaction:
   - Change the artwork to `draft`.
   - Clear `published_at`.
   - Clear `public_image_path`.
   - Set `is_featured = false`.
   - Enqueue the former public derivative for cleanup.
   - Make the cleanup eligible for an immediate post-commit attempt.
5. Commit the database transaction.
6. Remove the artwork from public projections immediately as a consequence of the committed state.
7. Attempt deletion of the former public object immediately after commit.
8. Use the safe cleanup claim and current-reference check before deleting.
9. If deletion succeeds, resolve the cleanup row.
10. If deletion fails, preserve the retryable cleanup row and show **Cleanup Pending** in the administrator interface.
11. Provide a protected **Retry Cleanup** action.
12. Retain a manual cleanup script as an operational backstop.

Never delete the object first and hope that the later database update succeeds.

Never claim that unpublishing succeeded if the database transaction or required queue insertion failed.

The original private source remains available for a later authorized republish.

## 12.14 Artwork deletion flow

On deletion:

1. Re-verify administrator identity.
2. Load the current record.
3. Confirm the explicit destructive action.
4. Delete the artwork row and enqueue the relevant object paths for cleanup in the same database transaction.
5. Preserve required upload-token expiry grace for the private source.
6. Commit the database transaction.
7. Remove the record from the public and administrator lists according to the committed state.
8. Delete Storage objects later through the Storage API using the guarded cleanup workflow.
9. Keep a retryable cleanup row if Storage deletion fails.

The UI may report that the record was deleted while asset cleanup is pending, but it MUST NOT claim that all physical assets were removed before that is confirmed.

## 12.15 Cleanup queue safety

`storage_cleanup_queue` is the authoritative durable record of Storage objects awaiting cleanup.

Every cleanup operation MUST:

- Use the Supabase Storage API for object deletion.
- Claim queue work through a safe state/locking protocol.
- Re-check current object references immediately before deletion.
- Verify that an object is not currently referenced by an artwork or profile.
- Check pending-upload state and signed-token expiry/cleanup grace.
- Respect the transaction interlock with publish and replacement.
- Make deletion idempotent.
- Resolve queue rows only after successful deletion.
- Preserve sanitized failure details and retry state.
- Re-check safety conditions after a failed attempt.
- Recover stale `processing` claims only after the defined lease window and a fresh reference check.

**Never delete objects directly from Supabase's internal `storage.objects` table through SQL.**

Database records and Storage object bytes are separate resources. Deleting metadata is not the same as deleting the Storage object.

A delay by itself does not prevent publish/cleanup races.

For queue upserts:

- Use an idempotent design.
- Preserve the latest required `process_after` deadline.
- Never reset a `processing` claim without an explicit recovery check.
- Never steal another processor's active claim.
- Merge repeated cleanup reasons safely.
- Do not make an object eligible earlier by accident.

No direct public grants may read or write pending-upload, rate-limit, or cleanup tables.

## 12.16 Cache behavior

Unpublish stops the committed public database projection from referencing the artwork immediately.

It does not guarantee immediate revocation of a previously shared URL, removal of pixels already downloaded, or instantaneous CDN/browser-cache invalidation.

The application MUST NOT promise a fixed URL-revocation SLA that the deployment has not proven.

Use:

- Unique versioned object paths.
- Conservative and documented caching behavior.
- Public metadata revalidation after relevant successful commits.
- No public caching of private dashboard records.
- Signed, time-limited URLs for private administrator previews.

Verify actual direct Storage and Next.js optimized-image URL behavior during the deployed acceptance test. Record measured behavior instead of inventing a cache invalidation guarantee.

---

# 13. Artwork, Offerings, and Profile State Rules

## 13.1 Artwork metadata

Artwork metadata updates MUST NOT accidentally alter image paths.

Only the dedicated image replacement workflow may change the image source or derivative paths.

A title change must not silently rewrite an existing stable slug. A slug change must be explicit and collision-checked.

Reject metadata-form attempts to modify internal paths, owner IDs, publication timestamps, or other protected values.

Where practical, detect stale editing and prevent one administrator form submission from silently overwriting a newer saved state.

Use database-managed timestamps.

## 13.2 Draft state

A Draft is a persisted artwork record, not a failed save.

A successfully saved Draft must:

- Exist in the administrator's artwork list.
- Have a `draft` status.
- Have `published_at = NULL`.
- Have `public_image_path = NULL`.
- Have no public derivative actively referenced for that artwork.
- Remain inaccessible through public artwork projections.
- Keep its private source available to authorized management workflows.

The UI must clearly identify Draft state.

## 13.3 Featured state

`is_featured` is a deliberate artwork preference, not a substitute for publication state.

Only valid application rules may expose featured art publicly.

Unpublishing must clear `is_featured = false`.

Publishing must not silently change it unless an explicit valid feature-state update is included.

## 13.4 Commission offerings

Public pages may display active offerings only.

The administrator may view inactive offerings and update their state and display order.

An offering referenced by an inquiry must be deactivated rather than hard-deleted.

Existing inquiries must retain their original title snapshots even if an offering is renamed later.

Validate display order, monetary values, and all offering-specific fields with Zod and corresponding database constraints where applicable.

## 13.5 Commission availability

Availability has the documented states **Open**, **Waitlist**, and **Closed**.

Its presentation must remain consistent across the public commission page, inquiry form, profile/settings UI, and server-side submission rule.

Do not use color alone to communicate availability.

A Closed state must include explanatory text.

The current server-side availability state is authoritative. A stale browser page cannot permit a new inquiry after the artist closes commissions.

## 13.6 Profile editing

Profile edits MUST pass through a protected server operation after `requireAdmin()`.

Public output may contain only approved profile fields.

Keep internal identity values and private operational fields out of public projections.

Avatar changes must follow the required private-upload, Sharp-derivative, guarded-commit, and Storage cleanup workflow.

---

# 14. Error Handling and Logging

## 14.1 Safe client errors

Never expose any of the following to the browser:

- Raw SQL error messages.
- Database connection strings.
- Stack traces.
- Supabase service credentials.
- Private object paths where disclosure is not intended.
- Signed URLs for private images beyond their intended authorized use.
- Internal schema details unnecessary to the user.
- Rate-limit secrets or hash keys.
- Cleanup queue implementation details.
- Unfiltered server exceptions.

Use safe, generic, actionable error messages.

Examples of appropriate user-facing messages include:

- “We could not save this artwork. Please try again.”
- “This file could not be processed. Choose a supported image and try again.”
- “Your request could not be submitted right now. Please try again later.”
- “The image was updated, but cleanup of the previous image is still pending.”

The message must reflect the real authoritative state. Do not claim that an operation succeeded when it failed.

## 14.2 Error classification

Handle expected failures explicitly:

- Invalid request.
- Validation failure.
- Missing or invalid session.
- Administrator authorization failure.
- Not found.
- Invalid domain-state transition.
- Commission availability conflict.
- Rate-limit rejection.
- Storage upload/download/delete failure.
- Sharp decoding or output-validation failure.
- Database constraint violation.
- Cross-service partial failure.
- Unexpected server error.

Keep messages safe and responses predictable.

## 14.3 Logging

Logs SHOULD support diagnosis without storing unnecessary personal information.

Do not log:

- Secrets.
- Auth tokens.
- Passwords.
- Full signed URLs.
- Private file contents.
- Raw IP addresses as persistent rate-limit keys.
- Entire inquiry descriptions or other sensitive request payloads without an approved need.

A cleanup queue's `last_error` must be sanitized. Never store credentials or signed URLs in that field.

Do not return logged exceptions to the user.

## 14.4 Partial failure is a first-class condition

Database and Storage operations do not share a single ordinary PostgreSQL transaction.

Where a workflow spans them, define rollback/cleanup intent, commit order, retries, and idempotency explicitly.

Never report success until the necessary authoritative state is durable.

Do not delete the old image merely because a replacement was uploaded.

Do not delete a Storage object before the database no longer references it and the cleanup protocol proves it safe.

Do not mark a cleanup row resolved when Storage deletion failed.

---

# 15. TypeScript and General Coding Standards

## 15.1 Strict TypeScript

Use strict TypeScript and preserve the repository's intended compiler settings.

The use of `any` is strictly forbidden except where an unavoidable external interface makes it mathematically or technically necessary and no safe alternative exists.

Before considering `any`, use:

- `unknown`.
- Runtime validation with Zod.
- Narrowing.
- A discriminated union.
- A generic type.
- A precise object shape.
- Generated Supabase database types.
- A small, explicitly checked adapter around an untyped external API.

Any exceptional `any` MUST be localized, documented, justified, and prevented from contaminating the rest of the codebase.

Do not use `as any` to silence a type error.

Do not use type assertions to pretend unvalidated external input has already passed validation.

## 15.2 Domain types

Use generated database types where available.

Keep database row types, validated input types, and UI view-model types distinct when their responsibilities differ.

Do not expose a raw database row to the client merely because it is convenient.

Do not use a single loose type that contains public fields, private fields, and server-only operational fields indiscriminately.

## 15.3 No silent type suppression

Do not introduce `@ts-ignore` to suppress an error.

Do not introduce `@ts-expect-error` without a specific, understood reason and a comment explaining the exact issue.

Do not disable TypeScript rules globally to get the build green.

Fix the underlying type or isolate a truly unavoidable interoperability issue.

## 15.4 Readability and cohesion

Prefer small modules with one clear responsibility.

Avoid:

- Giant components.
- Generic database helpers exposing arbitrary tables or columns.
- Duplicated authorization logic.
- Repeated hand-built schema validation.
- Broad exception swallowing.
- Hidden mutation side effects.
- Premature abstractions with no demonstrated reuse.
- One-off global styling exceptions.
- Dead code and placeholder implementations presented as complete features.

Reuse should not obscure important differences in permission or lifecycle behavior. For example, a public `ArtworkCard` and an administrator artwork row can reuse visual primitives while retaining different data and action permissions.

---

# 16. UI/UX and Design System

## 16.1 Visual direction

The public portfolio must feel like a contemporary independent artist's editorial gallery.

The design prioritizes:

- Warm ivory surfaces.
- Dark ink typography.
- Large, well-presented artwork imagery.
- Restrained terracotta interaction cues.
- Muted sage and dusty lavender as supporting accents.
- Clear whitespace, hierarchy, and responsive image presentation.

Avoid the generic blue-and-white SaaS appearance for public pages.

Do not overuse gradients, glassmorphism, glowing borders, or heavily rounded cards.

The dashboard may have a dark ink navigation rail with light text, but content surfaces should remain coherent with the public brand.

The artwork should remain the central visual focus.

## 16.2 Exact color tokens

Implement the palette through named CSS variables or equivalent Tailwind theme tokens. Do not scatter the raw hex values throughout components.

### Primary neutrals

| Token | Exact value | Use |
|---|---|---|
| `--color-paper` | `#F7F4EE` | Principal warm public background |
| `--color-surface` | `#FFFEFC` | Cards, forms, modals, elevated content |
| `--color-surface-muted` | `#EFEAE2` | Secondary panels, image frames, section bands |
| `--color-ink` | `#272522` | Primary text and headings |
| `--color-ink-soft` | `#48433E` | Secondary headings and emphasized text |
| `--color-text-muted` | `#6A635B` | Secondary text and metadata |
| `--color-border` | `#E2DBD1` | Decorative dividers and subtle boundaries only |
| `--color-border-strong` | `#8A8076` | Meaningful form boundaries and focus indicators |

### Brand and supporting accents

| Token | Exact value | Use |
|---|---|---|
| `--color-accent` | `#A34F3B` | Primary CTA fill and brand emphasis |
| `--color-accent-hover` | `#843C2C` | Hover/pressed state and accessible text/icons on accent-soft |
| `--color-accent-soft` | `#F2E1DA` | Soft accent background |
| `--color-sage` | `#536B5A` | Positive states and restrained secondary accents |
| `--color-sage-soft` | `#E4ECE5` | Success background |
| `--color-lavender` | `#6D5C86` | Restrained secondary creative accent |
| `--color-lavender-soft` | `#ECE7F2` | Secondary creative background |

### Semantic status colors

| Token | Exact value | Use |
|---|---|---|
| `--color-success` | `#276749` | Saved, published, completed |
| `--color-warning` | `#8A5A12` | Waitlist, pending cleanup, attention |
| `--color-danger` | `#B42318` | Validation failure and destructive-operation warnings |
| `--color-info` | `#355C7D` | Informational messages |

Do not quietly substitute fashionable colors or introduce unrelated palettes.

Status color MUST be accompanied by visible text or an appropriate additional cue.

Do not rely on `--color-border` as the sole visible boundary of an input or meaningful interactive control.

Use `--color-border-strong` where a meaningful form boundary or focus indicator requires stronger contrast.

Do not use the main terracotta accent as small text on `--color-accent-soft`. Use `--color-accent-hover` for text and icons on accent-soft where high contrast is required.

## 16.3 Typography

Use:

- **DM Serif Display** for major editorial headings.
- **DM Sans** for body copy, labels, controls, interface text, metadata, and dashboard content.

Use a compatible system fallback if external font loading is unsuitable.

The initial design scale is:

| Text style | Typeface | Size / line height | Weight |
|---|---|---|---|
| Display / hero | DM Serif Display | 56–72 px / 1.02–1.10 | Regular |
| H1 | DM Serif Display | 40–52 px / 1.05–1.15 | Regular |
| H2 | DM Serif Display or DM Sans | 30–36 px / 1.15–1.25 | Regular or Medium |
| H3 | DM Sans | 22–26 px / 1.25–1.35 | Semibold |
| Large body | DM Sans | 18–20 px / 1.55–1.7 | Regular |
| Body | DM Sans | 16 px / 1.55–1.7 | Regular |
| Small / metadata | DM Sans | 13–14 px / 1.4–1.5 | Regular or Medium |
| Button / navigation | DM Sans | 14–16 px / 1.2–1.4 | Medium or Semibold |
| Table / dashboard data | DM Sans | 13–15 px / 1.4–1.5 | Regular or Medium |

Responsive typography must preserve hierarchy while scaling the largest display text down on smaller screens.

Do not make the dashboard difficult to scan merely to preserve decorative typography.

## 16.4 Tailwind token implementation

Define the approved palette and typography in the theme mechanism appropriate to the installed Tailwind version.

Do not assume a configuration syntax from Tailwind v3 when the project uses another major version.

Reusable components must reference the named tokens.

Avoid one-off hex values and inconsistent spacing rules when an existing token or reusable component can solve the problem.

Mobile-first responsive behavior must be verified at 360, 768, and 1280 CSS-pixel widths.

## 16.5 Component behavior

Build reusable primitives for:

- Buttons.
- Input controls.
- Field labels and validation feedback.
- Dialogs.
- Destructive confirmations.
- Status badges.
- Loading and empty states.
- Tables, lists, and card grids.
- Form submission feedback.
- Dashboard navigation.
- Upload progress and failure states.

A reusable component MUST NOT conceal security-sensitive differences between public and administrator behavior.

Do not implement a control that appears functional but has no implemented operation.

Use explicit labels such as “Save draft,” “Publish artwork,” “Unpublish,” “Delete artwork,” “New inquiry,” and “Closed for commissions.”

Avoid vague consequential labels such as “Proceed.”

## 16.6 Destructive actions

Destructive operations must have clear labels and deliberate confirmation behavior.

A confirmation must identify the affected record and communicate the consequence.

Cancel must leave authoritative state unchanged.

Do not rely on a color change or unlabeled trash icon as the only signal that an action is destructive.

After an operation, the UI must reflect the actual committed state, including cases where Storage cleanup remains pending.

---

# 17. Accessibility Requirements

Accessibility is mandatory, not decorative polish.

## 17.1 Labels and names

Every input MUST have a visible, programmatically associated label.

Use semantic HTML labels and form controls.

Placeholder text MUST NOT be the only label.

Use appropriate `aria-*` attributes when they improve the accessible name, description, status, or interaction behavior. Do not add incorrect ARIA attributes merely to satisfy a checklist.

Buttons and icon-only controls MUST have accessible names.

## 17.2 Error feedback

Validation failures must be understandable to users of assistive technology.

Each field error must be associated with the relevant input where appropriate.

Use `aria-describedby`, `aria-invalid`, live regions, or other semantic mechanisms when they accurately represent the control state.

Do not rely only on border color or an icon to communicate an error.

## 17.3 Keyboard and focus

Every interactive control MUST be keyboard-operable.

Focus indicators must remain visible against light and dark surfaces.

Do not remove browser outlines without replacing them with an equally visible focus treatment.

Dialogs and menus must have coherent keyboard behavior, focus management, and an accessible dismissal mechanism.

## 17.4 Color contrast

Verify foreground/background contrast using the actual rendered token combinations.

Target at least 4.5:1 contrast for normal text where required.

Target at least 3:1 non-text contrast for meaningful control boundaries and focus indicators where required.

Do not assume a token is automatically accessible because it is named `text-muted`, `accent`, or `border`.

Recheck contrast whenever a background, text color, status treatment, or interaction state changes.

## 17.5 Status communication

Never communicate publication state, commission availability, inquiry status, errors, or success through color alone.

Use readable text and an appropriate icon or structural cue when helpful.

## 17.6 Responsive behavior

Review the application at:

- 360 CSS pixels.
- 768 CSS pixels.
- 1280 CSS pixels.

The gallery must adjust columns and spacing to the available width.

The dashboard sidebar must become a keyboard-accessible mobile navigation surface at narrow widths.

Artwork must retain its intended composition and must not be cropped unexpectedly.

Forms, dialogs, menus, tables, and status badges must remain usable on narrow screens.

## 17.7 Motion

Respect reduced-motion preferences.

Canonical durations, easing curves, stagger patterns, handoff delays, and animation safety buffers MUST follow `docs/design/motion-system.md`. CSS/WAAPI code MUST reuse the tokens in `src/app/globals.css` and `src/lib/motion/motion-tokens.ts`; do not introduce a parallel hardcoded interval where a semantic token already exists.

When changing motion, update the motion documentation and run `npm run test:motion-system`. Preserve reduced-motion support, keyboard/touch access, and synchronization between animation completion events and any safety timers.

Do not introduce unnecessary motion that interferes with readability, focus, or task completion.

---

# 18. Routing, Public Data, and UI States

## 18.1 Intended public routes

The target route map includes:

- `/`
- `/gallery`
- `/artworks/[slug]`
- `/commission`
- `/contact` where implemented
- `/terms` where implemented

## 18.2 Intended administrator routes

The target dashboard includes:

- `/login`
- `/dashboard`
- `/dashboard/artworks`
- `/dashboard/artworks/new`
- `/dashboard/artworks/[id]/edit`
- `/dashboard/offerings`
- `/dashboard/offerings/new`
- `/dashboard/offerings/[id]/edit`
- `/dashboard/commissions`
- `/dashboard/commissions/[id]`
- `/dashboard/settings`

Inspect the actual route tree before linking to these paths. Do not fabricate links to missing pages or pretend an unfinished route is implemented.

## 18.3 Required interface states

Where appropriate, implement explicit:

- Loading.
- Empty.
- Success.
- Validation failure.
- Service failure.
- Unauthorized.
- Not found.
- Draft.
- Published.
- Cleanup Pending.
- Upload in progress.
- Upload failure.
- Save in progress.
- Destructive confirmation.
- No active commission offerings.
- Closed commission availability.

A blank screen is not a valid substitute for an empty or error state.

Mock content must be clearly marked as temporary and must not be presented as persistent data.

Before sign-off, remove temporary fixtures from production data paths.

## 18.4 Metadata and not-found behavior

Add appropriate page metadata.

A Draft or nonexistent artwork slug must safely resolve to a not-found response.

Do not expose private content through metadata, image URLs, server-rendered props, or error messages.

Public artwork metadata must be revalidated after successful publication changes and relevant public metadata changes.

---

# 19. Security Testing Requirements

Security testing must validate effective permissions rather than only the intended UI behavior.

## 19.1 Identity and authorization tests

Test at least these actors:

1. Anonymous visitor.
2. Authenticated non-administrator.
3. Configured administrator.

Verify that:

- An anonymous user cannot access the dashboard or call protected mutations successfully.
- An authenticated non-administrator is denied administrator operations.
- The administrator can perform allowed operations.
- `requireAdmin()` rejects missing or mismatched identity.
- The privileged client is never called after authorization failure.
- A forged direct action request cannot bypass authorization.
- Sign-out prevents subsequent protected operations.
- Administrator revocation is reflected by server-side verification.

## 19.2 Public database access tests

Verify that unauthorized browser/API access cannot:

- Insert an inquiry directly.
- Read inquiry records.
- Read administrator notes.
- Read private Storage objects.
- Read pending-upload records.
- Read rate-limit records.
- Read cleanup queue contents.
- Modify profile administrator identity.
- Publish or unpublish artwork.
- Change inquiry status or notes.
- Update immutable inquiry submission fields.

Do not infer that a denied UI button proves database protection.

## 19.3 RLS, grants, views, and functions

Verify effective table grants, column privileges, RLS policies, view security behavior, Storage policies, and function `EXECUTE` grants.

Test direct API/RPC calls for any exposed functions.

Do not leave a database function callable by roles that should not use it.

Verify that public projections exclude private fields even when requested directly.

## 19.4 Inquiry integrity tests

Test all immutable original fields.

Attempt direct updates to every immutable field through the appropriate database/API pathway and verify rejection.

Test all allowed and denied inquiry state transitions.

Test concurrent updates that target the same prior status.

Verify that changing an offering title does not rewrite existing inquiry title snapshots.

## 19.5 Rate-limit tests

Test a short scripted burst against the actual persistent limiter.

Verify the documented five-attempts-per-15-minute threshold behavior.

Test concurrent attempts.

Verify that the honeypot works.

Verify that limiter failure rejects inquiry creation rather than falling back to in-memory state or allowing unrestricted submissions.

Verify that raw IP addresses and secret hash material do not leak into the database or client responses.

## 19.6 Image-pipeline tests

Test:

- JPEG, PNG, and WebP input.
- Unsupported formats.
- Spoofed extensions.
- MIME/signature mismatch.
- Corrupt files.
- Files just below and above 5 MiB.
- Width and height boundary cases.
- Images above the pixel-area limit.
- EXIF orientation.
- Animated or multi-frame input.
- Malformed images and decoder warnings.
- A valid derivative with correct orientation.
- WebP output format.
- Metadata stripping, including location metadata.
- Avatar output bounds.
- Artwork derivative bounds.
- Versioned object paths.
- Cleanup of failed derivatives.

Verify that the public output does not contain source EXIF/GPS, XMP, IPTC, or other source metadata.

## 19.7 Storage lifecycle race tests

Test at least these races:

- Publish versus cleanup.
- Image replacement versus cleanup.
- Upload finalization after the application's pending deadline.
- Cleanup before signed-token expiry.
- Cleanup after token expiry and grace.
- Duplicate cleanup enqueue.
- A stale `processing` claim.
- Database commit failure after derivative upload.
- Storage deletion failure after database commit.
- Retry after a failed delete.
- Unpublish followed by an immediate direct Storage URL request.
- Unpublish followed by an optimized-image URL request.

Verify that no committed artwork or profile path points to an object that cleanup can delete.

Verify that a failed cleanup remains retryable and visible to the administrator.

## 19.8 UI and accessibility tests

Test keyboard operation, labels, focus indicators, form errors, dialog behavior, status feedback, and reduced motion.

Inspect the three specified viewport widths.

Ensure no visual control suggests a feature that the MVP does not implement.

---

# 20. Testing and Quality Gates

## 20.1 Tests are part of the implementation

Do not treat testing as a final phase that can be skipped to save time.

Every meaningful feature should include appropriate tests within its implementation work.

Prioritize tests for:

- Domain rules.
- Validation.
- Authorization.
- Inquiry integrity.
- Image lifecycle.
- State transitions.
- Upload and cleanup races.
- Public/private data separation.
- Error behavior.

## 20.2 Quality checks

Inspect `package.json` to discover the actual available scripts before running commands.

Where configured, use the repository's intended equivalents of:

```bash
npm run lint
npm run typecheck
npm run build
```

These commands are examples of expected checks, not a claim that every script already exists.

If a mandatory check is missing, add or document it deliberately rather than pretending it ran.

Run appropriate tests for the changed subsystem.

Check the Git diff before completing work.

## 20.3 Definition of Done

A change is not complete merely because the implementation compiles.

A feature is complete only when applicable conditions are met:

- The implementation matches the documented product behavior.
- Untrusted input is validated with Zod on the server.
- Authorization is enforced at the actual mutation/access boundary.
- The correct Supabase client is used.
- Database invariants remain enforced.
- Public/private data separation is preserved.
- Image lifecycle operations use the required safe workflow.
- Relevant errors produce safe messages.
- The interface remains accessible.
- Tests or clearly identified verification steps cover critical behavior.
- Available lint, type, and build checks pass.
- Documentation is updated if behavior or architecture changed.
- Known failures or unverified assumptions are reported accurately.

If a check cannot be run, mark it as unverified. Never report it as passed.

---

# 21. Environment and Deployment Rules

## 21.1 Environment variables

Document required variable names in `.env.example` with placeholders only.

Keep real credentials in untracked local or approved hosting environment configuration.

The project may require values for:

- Supabase project URL.
- Supabase publishable/anonymous key.
- Server-only Supabase secret/service-role credential according to the chosen provider configuration.
- `KARYORA_ADMIN_USER_ID`.
- Any server-side rate-limit hash secret required by the implementation.

Inspect the actual modules and `.env.example` before assuming the complete environment list.

Every variable must have a clearly defined purpose and exposure boundary.

## 21.2 Deployment target

Vercel is the proposed hosting target for the Next.js application.

Supabase provides PostgreSQL, Auth, and Storage.

Do not assume local-only behavior will remain safe in a serverless environment. In particular:

- Process-local memory is not a shared rate limiter.
- Request body limits matter for large image uploads.
- The cleanup processor must be recoverable.
- Cross-service writes can fail partially.
- Cache behavior must be tested in the deployed environment.
- Environment variables must be configured in the deployed environment, not only locally.

## 21.3 Migrations and production state

Never change the production schema without the corresponding committed migration.

Do not claim that a migration is safe because it applied successfully to a populated development database only.

Apply migrations to a clean local/test database when possible.

Verify constraints, grants, RLS, triggers, functions, and indexes as part of migration acceptance.

## 21.4 Deployment evidence

The project blueprint expects verification evidence, not just a screenshot of a working home page.

Record, as applicable:

- Clean build output.
- Migration status and clean-database recreation results.
- Authorization test results.
- Upload and finalization failure cases.
- Publish/unpublish observations.
- Storage cleanup failure and retry observations.
- Direct and optimized image URL cache behavior.
- Responsive screenshots.
- Accessibility review notes.
- Route inventory.
- Known limitations and scope assumptions.

Do not invent these results.

---

# 22. Documentation and Decision Control

## 22.1 Blueprint baseline

`Artloom_Blueprint_v0.11_Final.md` is the detailed architecture baseline for the implementation.

The current product name is Karyora. Adapt branding and naming deliberately while preserving the blueprint's technical invariants.

Do not interpret the existence of a blueprint as proof that the official academic requirements have been verified.

The official assignment brief, rubric, and submission deadline remain unresolved unless the user supplies them.

Do not silently remove security or implementation requirements to meet an assumed deadline.

## 22.2 Documentation structure

Keep project documentation under `docs/` in a clear and maintainable structure, for example:

```text
docs/
├── README.md
├── blueprint/
│   └── Artloom_Blueprint_v0.11_Final.md
└── decisions/
    └── README.md
```

Do not move or rename existing documents until their actual locations and purpose have been inspected.

A decision record SHOULD explain:

- Context.
- The exact decision.
- Why the decision was chosen.
- Alternatives rejected.
- Security and migration implications.
- Verification required.
- Whether it supersedes an earlier decision.

## 22.3 Architectural deviations

A change to any of the following requires explicit review and documentation:

- Authentication or authorization architecture.
- Privileged-client boundary.
- Database schema or constraints.
- Inquiry immutability.
- Inquiry status transitions.
- Rate-limit behavior.
- Storage bucket policy.
- Image limits or transformation behavior.
- Publish/unpublish sequence.
- Cleanup queue lifecycle.
- Public/private projection rules.
- Design tokens.
- Public route contracts.
- Dependency or package-manager strategy.
- Product scope.

Do not silently change an invariant while implementing a feature.

---

# 23. Explicit NEVER-DO List

The following prohibitions are absolute.

## Security

- **NEVER** run `npm audit fix --force`.
- **NEVER** put `SUPABASE_SERVICE_ROLE_KEY` or an equivalent privileged secret in a `NEXT_PUBLIC_*` variable.
- **NEVER** expose privileged Supabase clients to browser code.
- **NEVER** skip `requireAdmin()` in a protected Server Action.
- **NEVER** use a protected page layout as the only authorization check.
- **NEVER** bypass Zod validation on the server.
- **NEVER** assume TypeScript types validate untrusted runtime data.
- **NEVER** trust a client-provided administrator ID, role, status, storage path, or publication timestamp.
- **NEVER** enable public signup or allow users to self-assign administrator privileges.
- **NEVER** expose raw SQL errors, stack traces, tokens, secrets, or private operational data to the client.
- **NEVER** grant the browser direct inquiry-table insert/read access.
- **NEVER** rely solely on RLS when the operation uses a service-role client.

## Inquiry integrity

- **NEVER** mutate original submission fields after an inquiry has been created.
- **NEVER** accept client-controlled `status`, `admin_notes`, submission timestamp, availability snapshot, or offering title snapshot.
- **NEVER** allow an invalid status transition.
- **NEVER** rely only on client-side checks to prevent an invalid status transition.
- **NEVER** treat inquiry submission as guaranteed commission acceptance.
- **NEVER** silently bypass the shared database-backed rate limiter.

## Image processing and Storage

- **NEVER** save original artwork images directly to a public bucket.
- **NEVER** publish the source bytes by copying them into the public bucket.
- **NEVER** omit Sharp from the server-side image-processing pipeline.
- **NEVER** omit `.rotate()` from the public derivative transformation pipeline.
- **NEVER** omit `.withoutMetadata()` from public WebP generation.
- **NEVER** trust filename extensions or browser MIME declarations as sufficient validation.
- **NEVER** accept sources exceeding 5 MiB, 4,000 pixels on either edge, or 16,000,000 pixels total.
- **NEVER** decode untrusted images without the configured pixel limit and strict validation.
- **NEVER** overwrite the currently active image object in place.
- **NEVER** delete a current Storage object before the authoritative database reference has safely changed.
- **NEVER** bypass the cleanup queue for ordinary lifecycle deletion.
- **NEVER** delete objects directly from the internal `storage.objects` table through SQL.
- **NEVER** assume waiting a fixed period alone eliminates cleanup/publish races.
- **NEVER** claim immediate URL revocation that has not been measured and proven.

## Database and migrations

- **NEVER** rely on undocumented manual production schema edits.
- **NEVER** skip migration files for schema or permission changes.
- **NEVER** expose pending-upload, rate-limit, or cleanup queue data to public roles.
- **NEVER** treat RLS as a replacement for column privileges, function grants, constraints, or server authorization.
- **NEVER** use a generic privileged database wrapper that accepts arbitrary tables, columns, or mutations from external input.
- **NEVER** allow an inquiry-referenced offering to be hard-deleted in violation of the documented reference constraints.
- **NEVER** use raw SQL interpolation with untrusted input.

## UI, types, and quality

- **NEVER** use `any` to silence an avoidable type error.
- **NEVER** use a placeholder as the only label for a form input.
- **NEVER** remove focus outlines without an accessible replacement.
- **NEVER** communicate a critical state using color alone.
- **NEVER** claim a feature exists when the control is merely decorative.
- **NEVER** replace public database content with hard-coded mock data while presenting it as persistent.
- **NEVER** claim tests, lint, type checking, migrations, or builds passed when they were not run.
- **NEVER** delete existing user work or rewrite unrelated modules without a reason.
- **NEVER** weaken security or data-integrity rules merely to simplify a task.

---

# 24. Required Completion Report

At the end of a substantive coding task, report:

## Changes made
Describe the implemented behavior and the files or subsystems changed.

## Security and data integrity
State which relevant authorization, validation, database, or Storage boundaries were preserved or added.

## Verification
List the checks and tests that actually ran and their results.

## Not verified
Identify any checks that could not run, untested failure cases, deployment-specific behavior, or unresolved assumptions.

## Follow-up
Mention only concrete remaining work, required decisions, or known defects.

Do not describe planned work as completed work.

Do not claim security certification from a code review or successful build.

Do not bury a critical failed test beneath a list of successful checks.

---

# 25. Final Enforcement Principle

Karyora must remain a secure, recoverable, image-focused artist portfolio with a tightly protected administrator workflow.

Every implementation must preserve these invariants:

1. **The server validates every untrusted mutation with Zod.**
2. **Every protected administrator operation independently enforces `requireAdmin()`.**
3. **The privileged Supabase client remains server-only and is invoked only after authorization.**
4. **Public inquiries are created through a narrow secure Server Action and a mandatory shared database-backed rate limiter.**
5. **Original inquiry fields remain immutable at the database boundary.**
6. **Inquiry status transitions are checked atomically against stored state.**
7. **Original images remain private and public derivatives are generated with Sharp, `.rotate()`, WebP encoding, and `.withoutMetadata()`.**
8. **Publishing, replacing, unpublishing, and deleting preserve recoverable cross-service state.**
9. **Storage deletion uses the Storage API and a race-safe cleanup queue, never direct SQL deletion of Storage objects.**
10. **Public projections expose only public data and never reveal Draft artwork or administrative records.**
11. **The defined visual system and accessibility requirements apply to every relevant interface.**
12. **No agent may claim success, test coverage, or security properties that have not been verified.**

When in doubt, preserve the existing secure state, reject an unsafe operation, retain a retryable cleanup intent, and report the uncertainty rather than guessing.

**Security, immutability, private-source preservation, and truthful system state are architectural requirements, not optional implementation preferences.**

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
