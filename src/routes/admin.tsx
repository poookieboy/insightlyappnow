import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, ChevronLeft, Check, X, Loader2, Heart, Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

interface Sub {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  mpesa_code: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

interface Donation {
  id: string;
  user_id: string | null;
  amount: number;
  mpesa_code: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  const load = async () => {
    const [s, d] = await Promise.all([
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("donations").select("*").order("created_at", { ascending: false }),
    ]);
    setSubs((s.data as Sub[]) ?? []);
    setDonations((d.data as Donation[]) ?? []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const review = async (sub: Sub, status: "approved" | "rejected") => {
    if (!user) return;
    setBusyId(sub.id);
    const update: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };
    if (status === "approved") {
      const days = sub.plan === "yearly" ? 365 : 30;
      update.expires_at = new Date(Date.now() + days * 86400_000).toISOString();
    }
    const { error } = await supabase.from("subscriptions").update(update).eq("id", sub.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved ✓" : "Rejected");
    load();
  };

  if (loading || isAdmin === null) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <Card className="p-8 text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-bold">Admin only</h1>
          <p className="mt-1 text-sm text-muted-foreground">You don't have access to this page.</p>
          <Link to="/home" className="mt-4 inline-block text-sm text-primary underline">Back home</Link>
        </Card>
      </AppShell>
    );
  }

  const pending = subs.filter((s) => s.status === "pending");
  const reviewed = subs.filter((s) => s.status !== "pending");
  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <AppShell>
      <div className="mb-3">
        <Link to="/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Settings
        </Link>
      </div>

      <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold">
        <Shield className="h-6 w-6 text-primary" /> Admin
      </h1>

      <Tabs defaultValue="subs">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subs">
            <Crown className="mr-1 h-3.5 w-3.5" /> Pro ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="donations">
            <Heart className="mr-1 h-3.5 w-3.5" /> Donations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subs" className="space-y-3">
          {pending.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">No pending requests.</Card>
          )}
          {pending.map((s) => (
            <Card key={s.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold capitalize">{s.plan} — KES {s.amount}</p>
                  <p className="font-mono text-xs text-muted-foreground">Code: {s.mpesa_code}</p>
                  <p className="text-[11px] text-muted-foreground">User: {s.user_id.slice(0, 8)}…</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-700">pending</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => review(s, "approved")}
                  disabled={busyId === s.id}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => review(s, "rejected")}
                  disabled={busyId === s.id}
                  className="flex-1 text-red-600"
                >
                  <X className="mr-1 h-4 w-4" /> Reject
                </Button>
              </div>
            </Card>
          ))}

          {reviewed.length > 0 && (
            <>
              <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
              {reviewed.map((s) => (
                <Card key={s.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">{s.plan} — KES {s.amount}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{s.mpesa_code}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      s.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-red-500/15 text-red-700"
                    }
                  >
                    {s.status}
                  </Badge>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="donations" className="space-y-3">
          <Card className="bg-gradient-primary p-4 text-primary-foreground">
            <p className="text-xs opacity-90">Total received</p>
            <p className="text-2xl font-bold">KES {totalDonations.toLocaleString()}</p>
            <p className="text-xs opacity-90">{donations.length} donations</p>
          </Card>
          {donations.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">No donations yet.</Card>
          )}
          {donations.map((d) => (
            <Card key={d.id} className="space-y-1 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">KES {d.amount}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{d.mpesa_code}</p>
              {d.phone && <p className="text-[11px] text-muted-foreground">📱 {d.phone}</p>}
              {d.message && <p className="text-xs italic">"{d.message}"</p>}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
