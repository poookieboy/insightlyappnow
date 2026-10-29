# Insightly featured Notes rollback

## Restore boundary

- Source snapshot: `8c0bb0e4e7047e03fc25e3a86729e6f362ab4961`, 18 October 2026, 17:51:32 UTC.
- First Notes task: 20 October 2026, 06:49 UTC.
- First feature implementation: `523d1536e8e57acbf3332f91f89fea1997545716`.
- Feature integration: `694fd6323ee81e6650719a9489017c3cf61adf6e`.

This is a selective source rollback, not a whole-project checkout. The historical snapshot is identifiable but not certified as a previously successful production build. A blanket restore would overwrite protected environment values and reintroduce custom Node/SPA hosting output and incompatible framework dependencies.

## Reverted

- `src/routes/notes.tsx`: restored the pre-feature My Notes default, existing profile/subscription gate, original shell and personal rich-editor behavior, and the explicitly under-development For You tab.
- `src/lib/note-storage.ts`: restored the original application-client attachment helper.
- `src/routes/notes.$noteId.tsx`: removed the dependency on Featured Notes metadata; kept its pre-existing personal reader and hook-order repair.
- `supabase/functions/ai-notes/index.ts`: removed the added featured-draft generation action; retained the four existing Groq personal-note actions and caller verification. No function was deployed or secrets changed.
- Removed `src/components/notes/{FeaturedNotesLibrary,NoteContent,NoteFields,NoteSubmissionForm,NotesSignIn}.tsx`, `src/hooks/useNotesAuth.ts`, `src/lib/featured-notes{,-api,-db.test,.test}.ts`, `src/routes/featured-notes.$noteId.tsx`, and `src/routes/notes-review.tsx`.
- Removed `docs/notes/{README.md,setup.sql}` and `supabase/migrations/20261024101500_featured_notes.sql`.
- Removed obsolete featured-publishing architecture instructions. Generated routes regenerate automatically, not by editing the generated file.

## Preserved intentionally

No environment file, key, payment handler/configuration, authentication provider/settings, subscription rule, backend schema/data, or other integration was changed. The selected external connection and Groq remain in place. No hosted backend was enabled/provisioned/resumed, no SQL was executed, and nothing was published.

Retained startup/compatibility fixes: framework web hosting defaults, aligned Router dependencies, Start route types, auth loading fallback/timeouts, OAuth callback/paper-preview child rendering, mobile navigation containment, Iris streaming fixes, browser-only diagram imports, Tiptap SSR safety, metadata, and personal-reader hook ordering. The Notes parent retains its child outlet and route metadata; these do not reintroduce the removed feature.

Removing repository SQL does not remove live tables. No live database objects or personal notes were deleted.

## Verification

- `bunx vitest run src/lib/ai-notes-rollback.test.ts src/lib/service-config.test.ts src/lib/chat-stream.test.ts`: **12 tests passed**. Notes AI tests execute the actual function source with mocked auth/Groq responses, retain summarize/simplify/quiz/exam and caller verification, and reject removed generation. They do not prove live Groq deployment.
- The automatic preview check reported `build OK` after the rollback and after the test addition (29 October 2026, 15:37:03 UTC). No manual `vite build` or standalone typecheck command was run; this environment runs the checks automatically. No separate production artifact was generated or deployed in this turn.
- Playwright checked 15 routes at 1280×1800, 390×844 and 320×740: **45 nonblank pages, zero unhandled runtime errors and zero horizontal overflow**. Phone sign-in and About screenshots were inspected.
- `/notes` and its personal child redirect to the existing `/auth` page when signed out, matching the restored profile gate. The removed featured reader/reviewer routes return the application's visible 404 page.
- `.env` and `.env.example` SHA-256 fingerprints are identical before and after. The rollback diff contains no Vite/service configuration, generated integrations, auth provider/settings, payment handlers, or unrelated routes.

Authenticated personal-note persistence, external payment verification, and external function deployments require a usable external test session; signed-out preview checks are not evidence for those flows. The signed-in Notes screen/editor was not visually verified, and the historical snapshot was not executed separately. Nothing was published, so the currently published site is not claimed to be restored.

The pre-existing profile-visibility security finding remains active: changing legitimate visibility requires the user's decision and database authorization, which were not supplied for this rollback. Caller verification in the retained Notes AI function was preserved rather than reverting to unauthenticated access.