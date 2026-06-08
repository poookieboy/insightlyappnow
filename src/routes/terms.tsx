import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Insightly" },
      { name: "description", content: "Terms of Service for Insightly by Ezenuel Studios." },
    ],
  }),
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-2xl px-5 py-8">
        <Link to="/settings" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-1 text-sm text-muted-foreground">Version 1.0 — Effective June 8, 2026</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-5 text-foreground">
          <Section title="1. Acceptance">
            <p>
              By creating an Insightly account ("Service") or using any feature, you agree to these Terms of Service ("Terms").
              Insightly is operated by <strong>Ezenuel Studios</strong> ("we", "us", "our") from Nairobi, Kenya. If you do not
              agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 13 years old. Users under 18 must have parent or guardian permission. By signing up you confirm
              this is the case.
            </p>
          </Section>

          <Section title="3. Account">
            <p>
              You are responsible for keeping your login credentials secure and for all activity under your account. Notify us
              immediately of any unauthorised access. We may suspend accounts that misuse the Service, attempt to abuse our AI
              quotas, or violate the law.
            </p>
          </Section>

          <Section title="4. Free Trial and Subscriptions">
            <ul className="list-disc pl-5 space-y-1">
              <li>New accounts include a <strong>7-day free trial</strong> with full access to all features.</li>
              <li>After the trial, continued use requires an active <strong>Insightly Pro</strong> subscription (KES 150/month or KES 1,500/year).</li>
              <li>Payment is processed via Stripe (cards) or M-Pesa. Pro activates automatically once payment is confirmed.</li>
              <li>Subscriptions auto-renew at the end of each billing cycle until cancelled. You can cancel anytime from Settings.</li>
              <li>Cancellation takes effect at the end of the current paid period. Fees already paid are non-refundable except where required by law.</li>
            </ul>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service to cheat on exams or violate your school's academic-integrity rules.</li>
              <li>Upload content that is illegal, infringing, harmful, or hateful.</li>
              <li>Reverse-engineer, scrape, or resell the Service or its AI outputs.</li>
              <li>Share your account or evade the trial / paywall.</li>
            </ul>
          </Section>

          <Section title="6. AI Features">
            <p>
              Insightly uses third-party AI models to generate tutoring responses, notes, and practice papers. AI output may be
              inaccurate, incomplete, or out of date. Always verify important information with your teacher or textbook. We are
              not liable for educational decisions made on the basis of AI output.
            </p>
          </Section>

          <Section title="7. Your Content">
            <p>
              You retain ownership of notes, tasks, and content you create. By using the Service you grant us a limited licence to
              store, process, and display that content solely to operate the Service for you.
            </p>
          </Section>

          <Section title="8. Termination">
            <p>
              You may delete your account at any time from Settings → Danger zone. We may suspend or terminate access for breach
              of these Terms or non-payment. On termination, your data is removed within 30 days except where retention is
              required by law.
            </p>
          </Section>

          <Section title="9. Disclaimers">
            <p>
              The Service is provided "as is" and "as available". To the maximum extent permitted by law, we disclaim all
              warranties (express or implied), including merchantability, fitness for a particular purpose, and accuracy.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, our total liability for any claim relating to the Service shall not exceed
              the amount you paid us in the 12 months before the claim arose.
            </p>
          </Section>

          <Section title="11. Changes to the Terms">
            <p>
              We may update these Terms from time to time. Material changes will be notified in-app. Continued use after the
              effective date means you accept the new Terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by the laws of the Republic of Kenya. Any dispute will be resolved in the courts of
              Nairobi, Kenya.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              Questions: visit <a href="https://ezenuelstudios.lovable.app" target="_blank" rel="noopener noreferrer" className="text-primary underline">ezenuelstudios.lovable.app</a>.
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
