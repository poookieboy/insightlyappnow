# Insightly Notes setup and limitations

## Implemented

- Featured Notes is the initial tab in `/notes`. Private My Notes remains available unchanged.
- AI-Featured and Student-Featured notes share search, grade, subject, and topic filters.
- Published readers render Markdown without raw HTML, including headings, lists, tables and examples.
- Student submissions are validated and submitted for review, never immediately published.
- Submitters can view status and public-to-submitter feedback, and update only Needs Changes submissions.
- `/notes-review` reuses the existing `admin` role. Only approved, corrected snapshots appear in the library. Private review comments have separate admin-only storage.
- Admins can add already-created AI-assisted material as a review draft. This feature does not call an AI provider and does not claim generated or KICD-certified content exists.

## Blocked hosted setup

At implementation time, Lovable Cloud reports **paused**. Live schema inspection and runtime rebinding fail. The browser configuration also references an older backend connection. No credentials or generated client files were edited.

1. Resume Lovable Cloud in the project.
2. Reconnect/rebind the project’s managed backend so browser and server use the same active instance.
3. Inspect the live schema for `note_submissions`, `note_review_details`, and `published_notes` before applying `setup.sql`; these tables are absent in the checked-in schema, but the live schema could not be verified.
4. Apply `setup.sql` using the Lovable Cloud migration tool, then regenerate types if required.
5. Verify the existing admin account/role; no user is promoted by this feature.
6. Run live signed-in submission, own-status, correction, publication, and read-back tests. Also test another student cannot read submissions/internal comments or call reviewer functions.

The UI reports errors honestly and retains unsaved form content. There is no fake local persistence, seeded curriculum content, auto-publication, alternate credential, or hidden AI fallback.

## Existing security finding

The profiles SELECT policy currently permits everyone to read profiles. It is unrelated to Notes and changing it would restrict existing profile access. It remains active pending database access and the user’s decision on intended profile visibility; Notes does not query other users’ profiles.

## Changed areas

`src/components/notes/*`, `src/lib/featured-notes*`, `src/routes/notes.tsx`, `src/routes/featured-notes.$noteId.tsx`, `src/routes/notes-review.tsx`, Notes/index metadata, `docs/notes/*`, `AGENTS.md`, and `roadmap.md`.