# Insightly roadmap

## Current request: restore pre-Notes experience
- [x] Identify the snapshot immediately before the 20 October featured Notes rollout.
- [x] Restore Notes-related files and remove added library/reviewer files without changing environment, payments/auth configuration, or external services.
- [x] Verify automatic checks, 12 retained/rollback tests, and 45 signed-out desktop/mobile route loads without blank pages, runtime errors, or overflow.
- [x] Record the restore boundary and intentional safety/compatibility exceptions in docs/rollback-notes.md.

## Verification blocked by external access or decisions
- [ ] Verify signed-in personal Notes and external integrations; blocked by unavailable authenticated session for the configured external service. No credential or auth settings changed.
- [ ] Resolve pre-existing public profile exposure; blocked by the user's profile-visibility decision and permission to change database access rules. No managed backend is to be enabled/resumed.

The prior featured Notes implementation tasks are superseded by the user's explicit rollback request. No pending featured Notes installation or publication is planned. External AI deployment/payment verification from earlier work remains unverified and outside this rollback.
