# Insightly Notes setup and limitations

## Implemented

- Featured Notes is the initial tab in `/notes` and renders without sign-in. My Notes retains the existing rich editor, now using the already-configured external service and its own session.
- AI-Featured and Student-Featured notes share search, grade, subject, and topic filters.
- Published readers render Markdown without raw HTML, including headings, lists, tables and examples.
- Student submissions are validated and submitted for review, never immediately published.
- Submitters can view status and public-to-submitter feedback, and update only Needs Changes submissions.
- `/notes-review` reuses the existing `admin` role. Only approved, corrected snapshots appear in the library. Private review comments have separate admin-only storage.
- Admins can add existing material or generate/summarize/simplify a draft using the existing Groq-backed `ai-notes` function. Generated content is previewed and explicitly accepted into a draft, never automatically published or represented as certified curriculum.

## Existing external-service setup

No backend was resumed, enabled, provisioned, replaced, or automatically migrated. The already-configured external client is reused; generated application clients and unrelated authentication/payment/premium flows were not edited.

Read-only probes of the external service returned `PGRST205` for `published_notes`, `note_submissions`, `note_review_details`, and `user_roles`. `user_notes` and `note_categories` were reachable. This confirms the featured library setup is missing from the external Data API, but does not establish every live column or policy.

1. Inspect that existing external project's schema, grants and policies using your database management tools. Apply only `supabase/migrations/20261024101500_featured_notes.sql` (also copied in `setup.sql`) if its Notes tables do not exist; do not replay unrelated historic migrations or create another project. If tables exist, reconcile additively, including the new review-details `description` and `reviewer_name` columns.
2. The migration preserves existing roles. If missing, it creates a protected `public.user_roles` table and `has_role` function with **no admins**. A trusted operator must assign `admin` to the intended existing Notes auth-user UUID; never assign roles from browser code, email matching or user-editable metadata.
3. App and Notes now share the generated persistent client targeting the user-selected external project through public Vite defines. Notes uses the same account/session; existing accounts and server authorization still need verification. No account or auth settings were changed.
4. Deploy the updated existing `ai-notes` function to the same external project through your existing deployment process. Set `GROQ_API_KEY` as an Edge Function secret there. Its auth checks also require the platform's server-side `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Never expose a Groq key through `VITE_*` or frontend code. No live Groq response was verified.
5. Existing personal notes are not copied, deleted or transformed. The Notes hub now reads personal notes on the external service; notes remaining on the older app service and the legacy local-note route remain there. Inspect its `user_notes`/`note_categories` ownership policies and the private `note-attachments` bucket with owner-folder policies before using uploads.
6. Verify signed-in submission → own status → reviewer correction/publication → published read-back on the actual external service. No external auth session was available for hosted end-to-end verification. Do not mistake mocked browser tests or local SQL tests for hosted persistence.

## Verification

The real `/notes` page renders on desktop and mobile while signed out, including filters, separate AI/student sections and a useful missing-storage message. `/notes-review` shows reviewer access instead of a blank page. The local PGlite suite applies the exact migration and verifies pending submissions, owner isolation, blocked self-approval, protected internal comments, reviewer-only publication, unpublishing/resubmission and stale edits. The automatic preview build/typecheck results are recorded in the final report; no separate manual production build is run by this environment.

The UI reports errors honestly and retains unsaved form content. There is no fake local persistence, seeded curriculum content, auto-publication, alternate credential, or hidden AI fallback.

## Existing security finding

The profiles SELECT policy currently permits everyone to read profiles. It is unrelated to Notes and changing it would restrict existing profile access. It remains active pending database access and the user’s decision on intended profile visibility; Notes does not query other users’ profiles.

## Changed areas

`src/components/notes/*`, `src/lib/featured-notes*`, `src/routes/notes.tsx`, `src/routes/featured-notes.$noteId.tsx`, `src/routes/notes-review.tsx`, Notes/index metadata, `docs/notes/*`, `AGENTS.md`, and `roadmap.md`.