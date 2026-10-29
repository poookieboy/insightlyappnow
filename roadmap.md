# Insightly roadmap

## Current request: restore pre-Notes experience
- [ ] Identify the snapshot immediately before the 20 October featured Notes rollout.
- [ ] Restore Notes-related files and remove added library/reviewer files without changing environment, payments/auth configuration, or external services.
- [ ] Verify automatic compile/build results, retained tests, mobile preview, and navigation.
- [ ] Report the exact restore boundary, preserved fixes, and external/security blockers.

## Current request: repair existing app startup
- [ ] Diagnose published startup and preview compile/runtime failures.
- [ ] Fix confirmed errors and mobile overflow without redesigning features.
- [ ] Verify protected external environment configuration without modifying it.
- [ ] Test main routes, navigation, Notes rules, and available integrations; inspect automatic production checks.
- [ ] Report external setup and profile-security approval blockers; do not publish an unverified build.

## Current request: finish Notes without backend provisioning
- [ ] Diagnose and fix Notes white-screen, routing, and signed-out rendering.
- [ ] Finish library/viewer, submissions, reviewer queue, and Groq-assisted draft states.
- [ ] Verify database contracts/policies with local integration tests; prepare existing-project SQL without applying to a managed backend.
- [ ] Verify desktop/mobile preview rendering and run focused tests plus automatic compile checks.
- [ ] Report configured-service limitations, manual setup, and pending profile-security approval.

## Current request: minimal build-blocker fixes
- [x] Diagnose the current route type errors and framework missing-export failure.
- [x] Apply minimal type/dependency fixes without changing payment, auth, or premium behavior.
- [x] Run focused Notes tests and inspect automatic typecheck/build results.
- [x] Report compile results separately from hosted-backend availability and the pending profile-security finding.

## Current request: reviewed Notes library
- [ ] Replace Notes For You placeholder with searchable AI-Featured and Student-Featured published notes.
- [ ] Add readable note pages, validated student submissions, and own submission statuses.
- [ ] Add admin-only review/correction/publishing with private internal comments.
- [ ] Apply additive database setup and verify persistence/permissions when Lovable Cloud is available.
- [ ] Verify affected UI and rules; report backend limitations.
- [ ] Address flagged profile visibility policy; blocked by paused Lovable Cloud and required approval before changing legitimate profile access.

## Earlier unresolved work (outside this request)
- [ ] Finish previously reported personal-note editor layout issue.
- [ ] Complete and verify previous Groq-only AI migration; requires GROQ_API_KEY.
