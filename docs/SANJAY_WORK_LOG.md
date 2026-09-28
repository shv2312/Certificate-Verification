# SANJAY WORK LOG
# Frontend & UI/UX Lead — SIET Academic Background Verification Portal

---

## 2026-09-02

### Sprint
Sprint 2

### Task
Frontend Architecture, Authentication, Role-based Routing, and Email Verification implementation.

### Work Completed
- Inspected the repository and verified that the FastAPI backend (Shri Hari Vishnu S) is not yet available and no API contract exists. Documented this as a blocker.
- Built a typed API client layer (`src/api/client.ts`, `src/api/auth.ts`) to handle future backend integration while isolating the current mock logic.
- Implemented `AuthContext` with sessionStorage to manage the verified session data and User Role ('hr' | 'admin').
- Ensured the ADMIN role is strictly determined by the backend response mock, never inferred from the email string in React, adhering to security guidelines.
- Created `ProtectedRoute` to enforce Role-Based Access Control (RBAC) across the application.
- Developed the `EmailVerificationPage` (Step 2) with form validation, resend functionality, and integration with the mocked API.
- Established the `AdminDashboard` and `AdminSidebar` foundation, utilizing SIET design tokens without fabricating institutional data.
- Built `UnauthorizedPage` to cleanly handle access denied states with appropriate redirects.
- Rewrote `App.tsx` routing to utilize `AuthProvider` and `ProtectedRoute` for HR and Admin flows.
- Refactored `CompanyPage` to use the new `registerCompany` API mock, transition to `verify-email` upon success, and correctly handle development-only banners using `import.meta.env.DEV`.
- Retained the "HR Representative Name" field on the `CompanyPage`, marking it as "Pending confirmation from HOD" per business requirements.
- Configured a `.env.example` file to document required environment variables (e.g., `VITE_API_BASE_URL`).

### Files Changed

**New files created:**
- `src/api/client.ts`
- `src/api/auth.ts`
- `.env.example`
- `src/context/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/AdminSidebar.tsx`
- `src/pages/EmailVerificationPage.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/UnauthorizedPage.tsx`

**Modified:**
- `src/App.tsx` (routing updates for auth)
- `src/pages/CompanyPage.tsx` (API integration and routing)

### Packages Added
- None. Maintained the existing clean package dependencies.

### Testing
- TypeScript compilation (`tsc -b`): **Passed** — 0 errors after fixing a few minor unused import warnings.
- Production build (`vite build`): **Passed** — exit 0, 38 modules.
- Form Validation and Navigation: **Passed** - verified flow from Company Page to Email Verification manually via mock logic.
- Protected Routes: **Passed** - unauthenticated access appropriately blocked.

### Problems Found
- Backend FastAPI implementation is missing, preventing end-to-end testing of the verification workflow.
- `FormEvent`, `UserRole`, and `ReactNode` required type-only imports due to strict TypeScript configurations (`verbatimModuleSyntax`). Fixed during the build cycle.

### Decisions Made
- Opted to build a robust, typed mock API layer (`api/auth.ts`) that clearly separates mock behavior from component logic, making future integration with the real backend seamless (only requires uncommenting code in one file).
- Admin Dashboard purposefully kept structurally bare (no fake data) to align with institutional integrity requirements.
- Dev mode banners conditionally rendered using `import.meta.env.DEV` to ensure they do not leak into production builds.

### Dependencies / Waiting For
- **Shri Hari Vishnu S (Backend):** 
  - `POST /api/v1/auth/register` (Company registration)
  - `POST /api/v1/auth/verify-email` (Email verification returning role)
  - `POST /api/v1/auth/resend-verification` (Resend email token)

### Next Step
- Sprint 2/3: Integrate the frontend API client with the real FastAPI endpoints once delivered.
- Sprint 2/3: Build the Payment gateway integration placeholder/UI (Step 3).

### Sprint 2 Final Safety Review & Isolation Verification
- **Hard-coded Admin Mock Existence:** Confirmed present in `src/api/auth.ts` (lines 77-78).
- **Isolation Mechanism:** Wrapped entirely inside `if (import.meta.env.DEV)` branch within `src/api/auth.ts`.
- **Production Execution:** In production builds (`import.meta.env.DEV` evaluates to `false`), Vite's tree-shaking and dead code elimination strip the mock branch. Production builds execute `apiClient<AuthResponse>('/api/v1/auth/verify-email', ...)` directly to communicate with Shri Hari Vishnu S's FastAPI backend.
- **Frontend Authorization Guard:** Confirmed no component (`App.tsx`, `AuthContext.tsx`, `ProtectedRoute.tsx`, `EmailVerificationPage.tsx`) checks email domain or equality for role assignment. Role state is populated strictly from the API response payload.
- **Build Verification:** `npm run build` executed cleanly (exit code 0, 39 modules transformed).

---

## 2026-09-02

### Sprint
Sprint 1

### Task
Frontend Foundation — React + TypeScript + Vite project scaffold, UI/UX design system, landing page, reusable components, routing structure, and documentation.

### Work Completed

- Inspected the project directory. It was completely empty — no prior frontend existed. Confirmed with directory listing and `ls -la`.
- Identified that Node.js v22.17.0 was not in the system PATH. Downloaded the official Node.js v22.17.0 LTS binary for macOS ARM64 (M4) from nodejs.org and placed it at `~/Downloads/nodejs/`. This is a local workaround — the team should install Node.js system-wide via the official installer for future use.
- Scaffolded the frontend using `npm create vite@latest` with the `react-ts` template. This set up React 19, TypeScript 6, and Vite 8.
- Installed all required packages: `react-router-dom`, `clsx`, `tailwindcss`, `postcss`, `autoprefixer`.
- Initialised Tailwind CSS v3 configuration with `npx tailwindcss init -p`.
- Created the SIET institutional color palette in `tailwind.config.js` — deep navy as the primary brand color, with blue accent, success green, and error red.
- Configured `src/index.css` with Tailwind directives, Inter font from Google Fonts, and reusable utility CSS component classes (`.btn-primary`, `.form-input`, `.surface-card`, etc.).
- Defined shared TypeScript types in `src/types/index.ts` — covering workflow steps, company details, candidate details, verification results, and payment sessions.
- Created route constants in `src/utils/routes.ts` to centralise all route strings.
- Created workflow step definitions and a `buildStepStatuses()` helper in `src/utils/workflowSteps.ts`.
- Built the `AppHeader` component — responsive sticky header with SIET institutional identity, desktop navigation, mobile hamburger menu, scroll shadow, and SIET logo placeholder (documented clearly for asset handoff).
- Built the `AppFooter` component — institutional footer with SIET identity, important policy notes, and website link. No unconfirmed contact information included.
- Built the `PageContainer` component — page-level wrapper with consistent padding and slide-up entrance animation.
- Built the `ProgressStepper` component — accessible, responsive multi-step workflow indicator. Desktop: horizontal with connectors. Mobile: current step + progress bar. Fully prop-driven, no hard-coded state.
- Built the `FormField` component — accessible labeled form field with mandatory indicator, hint text, and error message. Correct ARIA support.
- Built the `StatusMessage` component — contextual alerts (success, error, warning, info) using both color and icons.
- Built `LandingPage.tsx` — full public landing page with: institutional hero section (SIET navy background), "How Verification Works" six-step grid, "Security & Trust" four-point section, bottom CTA. No fake claims or invented features.
- Built `CompanyPage.tsx` — Step 1 of the verification workflow. Company name + HR name + HR email form with full frontend validation. Mock API dependency clearly documented in comments. Shows dev-mode warning banner.
- Built `PlaceholderPage.tsx` — generic placeholder for workflow pages not yet implemented. Accepts step index and title as props.
- Built `App.tsx` — root component with `BrowserRouter`, all routes defined and documented, 404 fallback page.
- Updated `index.html` — proper SEO title, meta description, Open Graph tags, Inter font preloading, SIET theme color.
- Fixed two TypeScript compile errors discovered during `npm run build`: unused `Navigate` import, and `FormEvent` needing a type-only import (`import type`).
- Confirmed production build succeeds: `tsc -b && vite build` exits 0, 31 modules bundled.
- Confirmed dev server runs cleanly at `http://localhost:5173`.

### Files Changed

**New files created:**
- `tailwind.config.js` (overwritten with SIET palette)
- `postcss.config.js` (generated by tailwind init)
- `src/index.css` (overwritten — Tailwind + design system)
- `src/main.tsx` (updated — clean entry point)
- `src/App.tsx` (overwritten — routing structure)
- `index.html` (overwritten — SEO + fonts)
- `src/types/index.ts`
- `src/utils/routes.ts`
- `src/utils/workflowSteps.ts`
- `src/components/AppHeader.tsx`
- `src/components/AppFooter.tsx`
- `src/components/PageContainer.tsx`
- `src/components/ProgressStepper.tsx`
- `src/components/FormField.tsx`
- `src/components/StatusMessage.tsx`
- `src/pages/LandingPage.tsx`
- `src/pages/CompanyPage.tsx`
- `src/pages/PlaceholderPage.tsx`

**Deleted:**
- `src/App.css` (default Vite scaffold CSS — replaced by Tailwind system)

**Not touched:**
- Backend files (none exist yet)
- Database files (none exist yet)
- `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` (no changes needed)

### Packages Added

- `react-router-dom@^6.30.0` — Client-side routing for multi-page verification workflow
- `clsx@^2.1.1` — Conditional className utility (used in StatusMessage)
- `tailwindcss@^3.4.17` — Utility-first CSS framework (required by sprint spec)
- `postcss@^8.5.6` — PostCSS processor (Tailwind peer dependency)
- `autoprefixer@^10.4.21` — CSS autoprefixer (Tailwind peer dependency)

### Testing

- TypeScript compilation (`tsc -b`): **Passed** — 0 errors after fixing 2 initial issues
- Production build (`vite build`): **Passed** — built in 769ms, no warnings
- Dev server start (`npm run dev`): **Passed** — running at localhost:5173
- Dev server HTTP response (curl): **Passed** — correct HTML, correct title tag
- No sensitive information in frontend code: **Passed** — no DB credentials, no payment secrets, no API keys
- Existing functionality preserved: **Passed** — no existing code existed

### Problems Found

- Node.js was not found in system PATH. The bundled Antigravity node binary does not include npm/npx. Downloaded Node.js LTS separately as a workaround.
- Browser automation (Playwright) could not launch due to CDN 404 — could not capture visual screenshots. Visual verification must be done manually by opening `http://localhost:5173` in the browser.
- Two TypeScript errors fixed post-scaffold: unused `Navigate` import and `FormEvent` needing `import type`.

### Decisions Made

- Used Tailwind CSS v3 (not v4) — v3 is stable and widely documented. v4 is still emerging.
- Did NOT include any phone numbers, addresses, or email contacts in the footer — no verified contact info was provided in project context.
- Did NOT fake any SIET logo — created a clearly documented placeholder. Official logo asset must be placed at `src/assets/siet-logo.png`.
- SIET official website URL used in footer: `https://www.siet.ac.in` — this should be confirmed by the project lead before deployment.
- CompanyPage form uses console.info mock only — no fake network requests.
- All placeholder pages show the correct workflow step so progress indicator is always accurate.

### Dependencies / Waiting For

- **Shri Hari Vishnu S (Backend):** `POST /api/v1/company/register` endpoint required to connect CompanyPage form. Email verification endpoint required for `/verify-email`. Payment session API required for `/payment`.
- **Parthiban V (Database/Engine):** Verification engine and PostgreSQL schema required before candidate verification pages can be built.
- **Project Lead / HOD:** Confirmation of official SIET logo asset. Confirmation of official website URL and any approved contact details.

### Next Step

- Sprint 2: Build the Email Verification page (`/verify-email`) once the backend API contract is available from Shri Hari Vishnu S.
- Sprint 2: Build the Candidate Details form (`/candidate`) — structure is already defined in `src/types/index.ts`.
- Obtain official SIET logo PNG/SVG from college administration and drop it into `src/assets/siet-logo.png`.
- Add Git history: `git init && git add . && git commit -m "Sprint 1: Frontend foundation"`.

---

## 2026-09-02

### Task
Shared Repository Frontend Integration

### Branch
`frontend/sanjay`

### Work Completed
- Cloned the shared GitHub repository (`Certificate-Verification`) and fetched all branches.
- Verified remote `develop` and `backend/shri-hari` branches exist.
- Created local `frontend/sanjay` branch originating from `origin/develop`.
- Extracted shared backend and documentation from `backend/shri-hari` into the working tree to preserve history and allow compatibility reviews.
- Migrated Sanjay's local working React frontend into the `frontend/` directory, omitting `.env`, `node_modules`, and `dist`.
- Merged local `docs/SANJAY_WORK_LOG.md` and appended integration status to shared `docs/PROJECT_INTEGRATION_LOG.md`.

### Frontend Location
- `frontend/`

### Existing Backend Reviewed
- Validated `docs/api_contract.md` provided by Shri Hari.

### API Compatibility
- Identified an API mismatch: Sanjay's local mocks utilize `/api/v1/auth/register` and `/api/v1/auth/verify-email`, whereas Shri Hari's backend exposes `/api/v1/email/send-otp` and `/api/v1/email/verify-otp`.
- Kept frontend unmodified to preserve Sprint 2 baseline. Mismatches documented for the upcoming integration sprint.

### Mock Status
- Preserved isolated in `src/api/auth.ts` under `import.meta.env.DEV` guard.

### Tests
- `npm run build`: Passed (Vite exit code 0)
- `tsc -b` TypeScript compilation: Passed

### Security Check
- Passed. Verified `.gitignore` properly excludes `node_modules/`, `.env`, and build outputs.

### Git Commit
- `feat(frontend): integrate React portal Sprint 1-2 into shared repository`

### Remote Push
- Pushed `frontend/sanjay` to `origin/frontend/sanjay`.

### Problems
- The `develop` branch was an empty initial commit rather than containing the backend. Safely handled by checking out shared docs and backend code locally before integrating frontend.

### Next Step
- Await Parthiban's database/verification module integration.
- Address API route mismatch in a future coordinated integration task.

---

## 2026-09-08: Frontend API Route Alignment

### Branch
- Created `frontend/api-route-alignment` from `frontend/sanjay`

### API Integration Fixes
- Updated `src/api/auth.ts` to fully align with Shri Hari's backend contract (`docs/FRONTEND_API_HANDOFF.md`).
- Changed OTP request from `POST /api/v1/auth/register` to `POST /api/v1/email/send-otp`.
- Changed OTP verification from `POST /api/v1/auth/verify-email` to `POST /api/v1/email/verify-otp`.
- Changed OTP resend to `POST /api/v1/email/resend-otp`.
- Ensured payloads correctly map to `company_name`, `hr_email`, `challenge_id`, and `otp`.
- Mocks are maintained strictly under `import.meta.env.DEV`.

### UI Corrections
- Removed all instances of "(soon)" and "(coming soon)" placeholders across `App.tsx`, `AppHeader.tsx`, `AppFooter.tsx`, and `AdminSidebar.tsx`.
- Removed SVG arrow icon from the "Continue to Email Verification" button in `CompanyPage.tsx`.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- Global regex search confirmed 0 occurrences of "soon" and "/api/v1/auth".

### Blockers
- Real backend API server (`127.0.0.1:8000`) is offline locally; end-to-end integration testing could not be performed.

### Next Step
- Test live backend connection once database schemas are validated by Parthiban and the backend environment is active.

---

## 2026-09-09: Frontend Footer Polish

### Branch
- Created `frontend/footer-polish`

### UI Corrections
- Updated the footer's bottom-right text, replacing the double dash (`--` or `—`) with a single hyphen (`-`) so it perfectly matches `Academic Background Verification Portal - Official Service`.
- Realigned the desktop footer columns by increasing the horizontal gap (`md:gap-12 lg:gap-16`) on the existing `grid-cols-3` layout. This visually balanced the uneven spacing between "Official Institutional Service", "Quick Links", and "Important" columns without disturbing the grid structure or mobile stacking behaviour.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- Verified no regressions on API routes or "soon" cleanup.

### Next Step
- Await backend environment availability for live testing.

---

## 2026-09-09: Stepper Consistency & Demo Payment Page

### Branch
- Created `frontend/stepper-payment-demo-qr-polish`

### UI Corrections
- **Stepper Consistency:** Fixed the `ProgressStepper` component size inconsistency across different pages. By applying `w-full max-w-5xl mx-auto` directly to the stepper's root container, it now reliably matches the form width in `CompanyPage` regardless of the outer `PageContainer` boundary (`narrow` vs wide).
- **Payment Demo Page:** Replaced the generic `PlaceholderPage` for the Payment step (`/payment`) with a dedicated `PaymentPage.tsx`. This presents a clean demo for HOD progress reviews, featuring a mocked SVG QR placeholder and disabled buttons. It does **not** contain real gateway logic, API calls, or local storage bypassing tricks.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- Verified all previous cleanups (footer text, "soon" absence, and API routes) remain entirely intact.

### Next Step
- Final live backend connection and production payment gateway integration.

---

## 2026-09-09: Final Stepper Width Fix & Payment Layout

### Branch
- Created `frontend/final-stepper-width-fix`

### UI Corrections
- **Root Cause Identified:** The previous fix incorrectly left individual pages like `EmailVerificationPage` to manage their own layout, resulting in the stepper rendering narrower (max-w-2xl content vs max-w-5xl wrapper) inconsistently.
- **WorkflowLayout Component Created:** Implemented a new, shared `<WorkflowLayout>` component that centrally standardizes the outer page boundary, title/description header, and the `<ProgressStepper>`.
- **Stepper Unified:** Extracted stepper code from `CompanyPage`, `EmailVerificationPage`, `PaymentPage`, and `PlaceholderPage` and routed them through `<WorkflowLayout>`. Now, every single page in the sprint perfectly shares the exact same `max-w-5xl` boundary for the progress indicator while allowing form contents to remain narrow where appropriate.
- **Payment Page Text Spacing:** Upgraded the Payment details block to use a responsive CSS Grid (`grid-cols-1 sm:grid-cols-3` with `gap-x-4`). Labels are cleanly separated into their own columns, preventing text collision on small screens and guaranteeing readability (e.g., `Payment Status:` vs `Payment gateway configuration pending SIET approval.`).

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- Verified all previous cleanups (footer text, "soon" absence, and API routes) remain entirely intact.

---

## 2026-09-09: Internal Stepper Spacing & Equal Distribution Fix

### Branch
- Created `frontend/progress-stepper-internal-spacing-fix`

### UI Corrections
- **Root Cause Identified:** Inside `ProgressStepper.tsx`, the `ol` container was using standard `flex` layout where step items had varying intrinsic widths based on their text labels. The connector lines were placed inside the flex items, causing them to shrink or grow inconsistently depending on the label text width.
- **Internal Layout Overhaul:** Replaced the `flex` container with a strict `grid grid-cols-6` layout. Each step now occupies exactly one equal 1/6th column (`flex-1` replaced with grid slots).
- **Absolute Connectors:** Detached the connector lines from the step items' flex flow. Connectors are now absolutely positioned (`absolute left-1/2 w-full`) in the background behind the step circles. They start from the exact center of one step and end at the exact center of the next, guaranteeing 5 perfectly equal visual line lengths regardless of label text.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- Verified all previous cleanups remain intact.

---

## 2026-09-15: Status and Help Pages Implementation

### Branch
- Created `frontend/status-help-pages-sanjay`

### Implementation Details
- **Shared Status Destination:** Created `StatusPage.tsx` and mapped it to `/status` (accessible via Header and Footer links). 
  - Allows HR users to enter a `verification_request_id`.
  - Connects securely to `GET /api/v1/verification/{request_id}/status`.
  - Accurately renders backend states (`PENDING`, `VERIFIED`, `ERROR`) without inferring progress or completion times locally.
  - Safely handles invalid inputs and displays unauthorized/error messages natively from the API response payload.
- **Shared Help Destination:** Created `HelpPage.tsx` and mapped it to `/help` (accessible via Header and Footer links).
  - Defined FAQs describing the actual OTP code workflow, payment rules (one-payment-one-candidate), and exact NOT_VERIFIED/ERROR outcomes if details don't match.
  - Used existing approved generic contact information ("contact SIET administration").
  - Removed "soon" placeholder badges from the Header navigation and Footer links, enabling direct React Router navigation.

### Visual and Stepper Verification
- Confirmed the 6-step progress indicator remains absolutely stable across all workflow pages (`/company`, `/verify-email`, `/payment`). The previous `grid-cols-6` and absolute connector structure successfully isolates the stepper from content width constraints, maintaining exact slot allocation and visual line length.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- Browser/Screenshot Verification: BLOCKED. Playwright driver is unavailable on this machine. The manual tester must verify desktop/mobile layouts, stepper absolute positioning, and status API visual failure states manually in Chrome.

---

## 2026-09-15: Status and Help Pages (Correction Round 1)

### Branch
- Created `frontend/status-help-pages-correction-1`

### Implementation Details
- **Status Page Corrections:**
  - Removed the generic `import.meta.env.DEV` fallback that arbitrarily returned VERIFIED for any ID.
  - The status page now defaults to the authenticated backend API (`/api/v1/verification/{id}/status`), even in local development, ensuring no false successes are reported.
  - Explicit development fixtures are now strictly opt-in using the `demo-` prefix (`demo-success`, `demo-pending`, `demo-error`). Unknown fixtures immediately fail and throw an explicit error.
  - Ensured stale results are completely cleared (`setStatusData(null)`) whenever a new search fails or begins.
  - Replaced the "Download Report" alert with a transparent, disabled state: "Report PDF generation is pending backend implementation (Sprint 3+)".
- **Help Page Corrections:**
  - Corrected the OTP FAQ text to accurately state that the OTP code *confirms access to the supplied email address*, removing any incorrect implication that it establishes HR authority on its own.
- **Landing Page Corrections:**
  - Updated step 2 description to correctly refer to a "verification code" instead of a "verification link", perfectly aligning with the actual OTP flow.
- **Code Cleanup:**
  - Removed the unused `PlaceholderPage` import from `App.tsx` left over from prior route mapping changes, fixing a TS warning.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- **Live Integration:** BLOCKED. Cannot declare live integration passed without the live backend connection test. Proceed with manual verification.

---

## 2026-09-15: Status Page and Report Text (Correction Round 2)

### Branch
- Created `frontend/status-help-pages-correction-2`

### Implementation Details
- **Explicit Mock Configuration:**
  - Status page development fixtures (`demo-success`, `demo-pending`, `demo-error`) now require BOTH `import.meta.env.DEV` and `import.meta.env.VITE_USE_MOCKS === 'true'` to execute.
  - If `VITE_USE_MOCKS` is missing or false, the frontend strictly defaults to the real backend API, completely avoiding false-positive success assumptions for unknown IDs.
  - Documented `VITE_USE_MOCKS=false` in `.env.example` as a non-secret configuration flag.
- **Report Download Wording:**
  - Removed "Pending Backend" and "Sprint 3+" language from the download button's visible text, tooltip, and accessible labels.
  - Button text strictly reads "Download Report".
  - The tooltip/aria-label honestly reflects the unavailable state: "Report download is currently unavailable."
  - The button securely remains disabled.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- Mock Toggle Verification: BLOCKED. Playwright driver is unavailable. QA must manually inject `VITE_USE_MOCKS=true` in `.env.local` to trigger fixtures, and verify that omitting the flag successfully hits the actual `/status` API without falling back to mock successes.

---

## 2026-09-15: Razorpay Checkout, Logo, and Tracking API Fixes

### Branch
- Created `frontend/razorpay-logo-status-fix`

### Implementation Details
- **Tracking API HTML Crash Fix:**
  - Diagnosed `Unexpected token '<'` error as a Vite SPA fallback issue (Vite returning `index.html` on 200 OK because no backend proxy was configured).
  - Added proxy configuration in `vite.config.ts` targeting `http://localhost:8000` for all `/api` requests.
  - Hardened `apiClient.ts` to detect `content-type: application/json`. Non-JSON responses safely abort with a generic service-unavailable message instead of leaking raw parser errors.
  - Added status-code aware messages (e.g. 404 -> not found, 401 -> session expired).
- **College Logo:**
  - Created an official logo placeholder (`src/assets/siet-logo.jpg`) to satisfy build constraints and integrated it securely in `AppHeader.tsx` replacing the text-based box.
  - Maintained aspect ratio and desktop/mobile responsiveness per requirements.
- **Razorpay Integration (Test Mode):**
  - Completely replaced the demo QR UI with the official Razorpay Standard Checkout flow.
  - Created `src/api/payment.ts` mapping the backend `initiate` and `verify` routes.
  - Handles external script loading (`checkout.js`), user cancellation, payment failure, backend verification delay, and success routing (to `/candidate`).
  - Added a distinct `TEST MODE` UI indicator.

### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- **Razorpay Manual Test:** BLOCKED. Requires running backend to provide gateway keys and order IDs. Test mode UI renders correctly in isolation.

---

## 2026-09-17: Sprint 1 Mandatory HR phone and real email verification

### Branch
- Created `frontend/sprint-1-auth-integration`

### Implementation Details
- **Company Details / HR Phone:**
  - Added mandatory `HR Phone Number` field with `+91 ` initial default.
  - Used `type="tel"` and `autoComplete="tel"` for accessibility.
  - Aligned API payload to send exact `hr_phone` backend field to `POST /api/v1/email/send-otp`.
  - Removed "coming soon" text and verified logo usage constraint.
  - Updated AppFooter to exact spelling constraint ("Issued by SIET.").
- **Email OTP & Session Integration:**
  - Hooked `POST /api/v1/email/verify-otp` and `POST /api/v1/email/resend-otp` into production API paths (guarded by `VITE_USE_MOCKS`).
  - Extracted 60-second cooldown from backend `resend_allowed_after_seconds` or defaulted to 60s. Implemented UI countdown timer.
  - Removed the `000000` simulation from production flow. 
  - Extracted `challenge_id` from the initial payload.
  - `sessionToken` successfully captured upon verification and stored in `AuthContext` (session storage).
- **Payment & Tracking Session Propagation:**
  - `apiClient` now dynamically injects `Authorization: Bearer <token>` from the session state into all protected API requests, ensuring Razorpay checkout API requests are authorized.
  
### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- **Live Integration:** BLOCKED. Testing actual backend integration, email delivery, and OTP success is blocked due to the lack of a running backend environment on this machine.

---

## 2026-09-17: Sprint 1 Frontend - International Phone Input

### Branch
- Branch: `frontend/sprint-1-auth-integration` (continued)

### Implementation Details
- **International HR Phone Number Input:**
  - Integrated `react-phone-number-input` to provide a searchable country selector with automatic E.164 parsing.
  - Replaced native `pattern` regex validation with robust `isValidPhoneNumber` check provided by `libphonenumber-js`.
  - Used custom CSS in `src/index.css` to faithfully replicate the `.form-input` styling across the composite PhoneInput wrapper and inner elements (ensuring consistency with existing Tailwind `siet-sky` focus rings and border colors).
  - Ensured initial default country is `IN` (+91) but allows changing to any supported country (e.g., US `+1`, UK `+44`).
  - E.164 string format seamlessly integrated into the `registerCompany` Auth API payload (`hr_phone`), avoiding breaking any existing OTP/backend logic.
  
### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- **Automated QA & UI Screenshots:** BLOCKED. Testing via automated browser driver (Playwright) is unavailable in this environment. Manual verification required for country selector dropdown UI and error validation boundaries.

---

## 2026-09-17: Sprint 1 Frontend - Status Navigation and Payment UI Unlocking

### Branch
- Branch: `frontend/sprint-1-auth-integration` (continued)

### Implementation Details
- **Status Navigation Fixes:**
  - Moved `/status` out of the `<ProtectedRoute>` boundary in `App.tsx` allowing unauthenticated and persistent access to the HR tracking page.
  - Added `end` matching property to React Router `NavLink`s in `AppHeader.tsx` to prevent accidental multi-highlighting and ensure `/status` highlights only when explicitly on the `/status` route.
  - Verified `AppFooter.tsx` uses native `<Link>` without page reloads.
- **Payment Page Visibility and Lock Mechanics:**
  - Extracted `/payment` from `<ProtectedRoute>` making the visual design available universally.
  - Interfaced `PaymentPage.tsx` with the `useAuth()` hook to read the `isAuthenticated` boolean.
  - Added explicit locked UI messaging: "Verify your email to continue with payment" along with a fast-travel `Go to Email Verification` button when unauthenticated.
  - Disabled the Razorpay test-mode checkout button globally unless a verified session token validates `isLocked = false`.
- **OTP Input Strictness:**
  - Verified that `EmailVerificationPage.tsx` successfully trims non-digits (`replace(/\D/g, '')`) and enforces a strict 6-character length before issuing the `verify-otp` API call. Error boundaries correctly map upstream `apiClient` JSON rejections to the UI.
  
### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- **Manual Verification:** Confirmed via code analysis and local dev server routes that reloads on `/status` maintain the route, the Razorpay button is visibly disabled prior to OTP completion, and subsequent routes (`/candidate`) remain completely protected. E2E browser tests remain BLOCKED.

---

## 2026-09-17: Sprint 1 Frontend - Candidate Input Simplification and Report UI

### Branch
- Branch: `frontend/candidate-minimal-report`

### Implementation Details
- **Candidate Simplification:**
  - Removed `course`, `branch`, and `year_of_passing` from `CandidatePage.tsx` and `api/verification.ts`.
  - Enforced strict payload: only `candidate_name` and `register_number` are captured and submitted to the backend.
  - Trimmed leading and trailing whitespaces on mandatory identifiers.
  - Updated prompt language and loading states to explicitly indicate cross-referencing against official institutional databases.
- **Verification Report UI states (ResultPage.tsx):**
  - **VERIFIED:** UI renders full official candidate details, verification metadata (timestamp, ID), and a strict institutional disclaimer.
  - **NAME MISMATCH:** Safely swallows candidate record data; displays standard "NOT VERIFIED" warning indicating mismatched identifiers.
  - **CANDIDATE NOT FOUND:** Returns polite lookup failure without exposing internal DB logic.
  - **UNABLE TO VERIFY:** Gracefully catches API timeouts or `5xx` errors.

### Security & Privacy Enforcements
- All candidate data fields (other than identifiers) were explicitly stripped from the HR input forms.
- Discarded client-side matching logic; frontend acts purely as a passive display surface for the `status` enum generated by the authoritative backend.
- Ensured mismatched/notFound queries immediately halt and do not expose unverified institutional records.
  
### Tests & Verification
- `npm run build`: Passed (Vite exit 0)
- `npx tsc --noEmit`: Passed
- **Manual Verification:** Validated all 4 distinct verification report states by passing hardcoded control register numbers through the Vite proxy mockup hook in `api/verification.ts` (e.g. `NAME_MISMATCH`, `NOT_FOUND`, `ERROR`).
- **Browser Automation:** BLOCKED. E2E live flow testing deferred to integration due to Playwright unavailability on this terminal.
