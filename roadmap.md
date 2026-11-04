# Insightly — Development, Repair & Redesign (Nov 2026)

## 1. Repair Iris AI (critical)
- [x] Root cause found: deployed `ai-tutor` edge function still requires GEMINI_API_KEY → returns "AI service is not configured."
- [ ] Rewrite `supabase/functions/ai-tutor/index.ts` to Groq-only (GROQ_API_KEY verified live on the external project via ai-revision probe).
- [ ] Verify frontend request/response handling matches streaming contract.
- [ ] Deploy step (user/CI holds the Supabase access token — none in sandbox).

## 2. Notes editor redesign (critical)
- [ ] Backgrounds: expand to 200+ with 8 categories (Minimal, Nature, Gradients, Aesthetic, Dark, Patterns, Study, Custom upload) + per-note persistence.
- [ ] Floating formatting toolbar: bottom-centred rounded island, horizontally scrollable, keyboard-aware, above bottom nav.
- [ ] Compact header (remove oversized green header), spacious canvas.
- [ ] Bottom-left Notes tools button (attach, insert image, scan/camera, templates, record, draw).
- [ ] Bottom-right Insights button → Iris AI panel (summarise, explain, key points, revision questions, flashcards, improve) via existing Groq ai-notes function.
- [ ] Word/char counters preserved.

## 3. Android launcher icon + splash (critical)
- [ ] Replace missing mipmap resources with official logo (all densities, legacy + adaptive fg/bg + monochrome).
- [ ] AndroidManifest icon wiring; branded splash (navy bg + centred logo, incl. v31 splash screen API).
- [ ] APK build requires Android SDK (not in sandbox) — resources prepared + verified structurally.

## 4. Regression testing
- [ ] Unit tests (vitest) for changed logic.
- [ ] Playwright smoke: auth, notes, Iris, navigation at mobile sizes.
