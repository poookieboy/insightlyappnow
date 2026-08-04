import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/RequireProfile";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/external-quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Bank — Insightly" },
      { name: "description", content: "The Insightly Quiz Bank is under development and will arrive in a future update." },
      { property: "og:title", content: "Quiz Bank — Insightly" },
      { property: "og:description", content: "The Insightly Quiz Bank is under development and will arrive in a future update." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequireProfile>
      <QuizBankPlaceholder />
    </RequireProfile>
  ),
});

function QuizBankPlaceholder() {
  return (
    <AppShell>
      <Link to="/dashboard" className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Dashboard
      </Link>
      <h1 className="mb-4 font-display text-2xl font-bold">Quiz Bank</h1>
      <ComingSoon
        title="Quiz Bank"
        icon={Target}
        emoji="🎯"
        message="This feature is currently under development and will be available in a future update. Thank you for your patience as we continue improving Insightly."
      />
    </AppShell>
  );
}
