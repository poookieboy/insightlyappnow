# Insightly: Pro/Trial Enforcement + Redesign Plan

This is a large scope. I'll ship it in **3 phases** so each phase is reviewable and working, not a giant unverifiable mega-edit.

## Phase 1 — Auth, Trial, Payments, TOS (functional core)

**Database (1 migration):**
- `public.user_subscription_status` table — `user_id`, `tier` (`trial`/`pro`/`expired`), `trial_started_at`, `trial_ends_at`, `pro_until`, `provider` (`stripe`/`mpesa`), timestamps. RLS: user reads own, service role writes. Auto-row on signup via trigger (extend `handle_new_user`).
- `public.legal_acceptances` — `user_id`, `tos_version`, `privacy_version`, `accepted_at`. RLS: user reads/inserts own.

**Trial logic:**
- On signup, trigger sets `tier='trial'`, `trial_ends_at = now() + 7 days`.
- New hook `useSubscription()` reads status; computes `isActive = tier==='pro' || (tier==='trial' && trial_ends_at>now())`.
- `RequireProfile` extended → if `!isActive`, redirect to `/go-pro` (only `/settings`, `/go-pro`, `/about`, `/donate`, `/auth` accessible).
- Trial banner in `AppShell` showing days remaining; turns red at ≤2 days; "Trial expired" full-screen card when over.

**Settings — Pro status card:**
- Shows current tier with badge, days left, plan expiry, "Manage subscription" / "Upgrade" CTAs.

**Payments (auto-activate):**
- **Stripe**: Enable Lovable's built-in Stripe payments. Create monthly (KES 150) and yearly (KES 1500) products. Checkout from `/go-pro`. Webhook server route `/api/public/stripe-webhook` flips `tier='pro'`, sets `pro_until`.
- **M-Pesa STK Push**: Needs Daraja credentials. I'll request `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY` as secrets. Server fn `initiateStkPush` → callback route `/api/public/mpesa-callback` auto-activates Pro.

**Terms of Service & Privacy Policy:**
- Generate `/terms` and `/privacy` route pages with full content (Insightly by Ezenuel Studios, Kenya jurisdiction, student data handling, AI usage disclosure, payment terms).
- On first login after signup OR if `legal_acceptances` row missing for current version → modal blocks app until both checkboxes checked + Accept clicked. Writes acceptance row.

**Google sign-in verification:**
- Confirmed `lovable.auth.signInWithOAuth("google")` is wired. I'll add console diagnostics and a "Test Google connection" debug button in `/auth` dev-only. After Phase 1 deploy I'll invoke a server fn that checks the configured providers and report back.

## Phase 2 — AI revamp + voice

- Remove AI hero image from `/tutor`.
- Restyle `/tutor` to **grey/black professional theme**: dark slate surfaces, neutral chat bubbles, no purple gradient, monospace accents.
- New server fn `ai-tts` calling **OpenAI TTS via Lovable AI Gateway** (`openai/gpt-5-mini` doesn't do TTS — I'll verify the gateway supports `gpt-4o-mini-tts` or fall back to Gemini TTS; if neither, I'll come back to you with options).
- `useVoiceChat` updated: server returns audio blob, client plays it. Voice = `nova` or `alloy` (warmest).

## Phase 3 — Full UI redesign

I'll generate **3 rendered design directions** for the home/dashboard using `design--create_directions` (locked palette/type/layout picked from a quick visual preference round). You pick one, then I rebuild every page (home, tasks, notes, timetable, revision, exams, tests, tutor, calculator, settings, go-pro, about, auth) to that direction in one sweep.

**Streak animation upgrade** (part of Phase 3):
- Flame icon with pulsing glow + counter that springs/scales on increment
- Streak milestone celebration (confetti at 7/30/100 days)
- Live shimmer on streak badge in dashboard

---

## What I need from you before starting

1. **M-Pesa Daraja credentials** (4 secrets) — I'll prompt with `add_secret` at the right moment. If you don't have these yet, I can ship Phase 1 with Stripe-only auto + M-Pesa staying manual, and add STK Push when you have the keys. **Tell me: have Daraja creds, or Stripe-only for now?**
2. **Stripe enable** — I'll trigger it; you'll fill the brief form (email, business name).
3. **Confirm I should start Phase 1 immediately** after you answer #1.

Phases 2 and 3 follow automatically — no extra approval needed unless something blocks.