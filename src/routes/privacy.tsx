import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Insightly" },
      { name: "description", content: "How Insightly by Ezenuel Studios collects, uses, and protects your data." },
    ],
  }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link to="/settings" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Version 1.0 — Effective June 8, 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-5 text-foreground">
          <Section title="1. Who we are">
            <p>
              Insightly is built by <strong>Ezenuel Studios</strong>, based in Nairobi, Kenya. We are the data controller of the
              information you provide while using the app.
            </p>
          </Section>

          <Section title="2. Data we collect">
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data</strong>: email, display name, profile picture, curriculum & grade.</li>
              <li><strong>Study data</strong>: tasks, notes, timetable entries, generated papers, exam results, streaks, badges, AI tutor conversations.</li>
              <li><strong>Payment data</strong>: M-Pesa confirmation code (manual flow); Stripe handles card details directly — we never see them.</li>
              <li><strong>Technical data</strong>: device type, browser, IP address, basic usage events.</li>
              <li><strong>Legal records</strong>: timestamp and version of Terms / Privacy Policy you accept.</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul className="list-disc pl-5 space-y-1">
              <li>To operate the Service (save your study data, sync streaks, generate AI responses).</li>
              <li>To process payments and manage your Pro subscription.</li>
              <li>To improve the Service (anonymised analytics).</li>
              <li>To send essential service emails (account verification, password reset, payment receipts).</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </Section>

          <Section title="4. AI processing">
            <p>
              When you use the AI tutor, generate papers, or transcribe notes, your prompts and uploaded content are sent to
              third-party AI providers (Google, OpenAI) through the Lovable AI Gateway. Providers process requests under their
              own privacy terms. We do not use your conversations to train AI models.
            </p>
          </Section>

          <Section title="5. Legal basis">
            <p>We rely on: (a) your consent (when you accept these terms); (b) performance of our contract with you; (c) our legitimate interest in operating and improving the Service; and (d) compliance with the law.</p>
          </Section>

          <Section title="6. Sharing">
            <p>We do not sell your data. We share only with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — database & authentication infrastructure.</li>
              <li><strong>Stripe</strong> — payment processing.</li>
              <li><strong>Safaricom (M-Pesa)</strong> — mobile payments.</li>
              <li><strong>Google / OpenAI</strong> via Lovable AI Gateway — AI features.</li>
              <li>Law-enforcement when legally required.</li>
            </ul>
          </Section>

          <Section title="7. Storage and security">
            <p>
              Your data is stored on encrypted Supabase infrastructure with Row-Level Security so only you (and authorised
              admins) can access your records. We use HTTPS for all transport. No system is 100% secure — promptly report
              suspected breaches.
            </p>
          </Section>

          <Section title="8. Retention">
            <p>
              Account data is kept while your account is active. After you delete your account, data is removed within 30 days
              except where retention is required by law (e.g. tax/payment records up to 7 years).
            </p>
          </Section>

          <Section title="9. Your rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Delete your account and data (Settings → Danger zone).</li>
              <li>Export your data (contact us).</li>
              <li>Withdraw consent at any time.</li>
              <li>Lodge a complaint with the Office of the Data Protection Commissioner of Kenya.</li>
            </ul>
          </Section>

          <Section title="10. Children">
            <p>
              We do not knowingly collect data from children under 13. Users aged 13–17 must have parent/guardian permission. If
              you believe a child has provided data without consent, contact us and we will delete it.
            </p>
          </Section>

          <Section title="11. International transfers">
            <p>
              Some of our processors (e.g. Stripe, Google) are located outside Kenya. Where required, we ensure appropriate
              safeguards under applicable law are in place.
            </p>
          </Section>

          <Section title="12. Cookies & local storage">
            <p>
              We use browser local storage to keep you signed in, store your offline study data, and remember preferences. We do
              not use third-party advertising trackers.
            </p>
          </Section>

          <Section title="13. Changes">
            <p>
              We may update this Policy. Material changes will be notified in-app. Continued use after the effective date means
              you accept the updated Policy.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              Reach us at <a href="https://ezenuelstudios.lovable.app" target="_blank" rel="noopener noreferrer" className="text-primary underline">ezenuelstudios.lovable.app</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mt-6">{title}</h2>
      <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
