import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const student = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const reviewer = "33333333-3333-4333-8333-333333333333";
const draft = { title: "Fractions", grade: "Grade 5", subject: "Mathematics", topic: "Fractions", content: "## Equal parts\nFour quarters form one whole.", source: "", display_name: "Student" };
let db: PGlite;
let id: string;
async function asUser(user: string | null, role = "authenticated") {
  await db.exec("RESET ROLE");
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [user ?? ""]);
  await db.exec(`SET ROLE ${role}`);
}
async function readSubmission() {
  const result = await db.query<{ updated_at: string }>("SELECT updated_at::text FROM public.note_submissions WHERE id=$1", [id]);
  return result.rows[0];
}
async function review(status: string) {
  const row = await readSubmission();
  if (!row) throw new Error("Expected submission");
  return db.query("SELECT public.review_featured_note($1,$2,$3::jsonb)", [id, row.updated_at, JSON.stringify({ ...draft, status, internal_comments: "Private reviewer correction", student_feedback: "Please check the example", description: "Fraction revision", reviewer_name: "Team reviewer" })]);
}

describe("Notes database authorization and publishing", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;`);
    await db.exec(readFileSync("supabase/migrations/20261024101500_featured_notes.sql", "utf8"));
    await db.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')", [reviewer]);
  }, 20000);
  afterAll(async () => { await db?.close(); });
  it("stores student submissions pending, never immediately published", async () => {
    await asUser(student);
    const result = await db.query<{ id: string }>("SELECT public.submit_featured_note($1::jsonb) AS id", [JSON.stringify(draft)]);
    id = result.rows[0]?.id ?? "";
    const rows = await db.query<{ status: string }>("SELECT status FROM public.note_submissions WHERE id=$1", [id]);
    expect(rows.rows[0]?.status).toBe("pending_review");
    expect((await db.query("SELECT id FROM public.published_notes")).rows).toHaveLength(0);
  });
  it("does not let students approve themselves or write publications", async () => {
    await asUser(student);
    await expect(review("approved")).rejects.toThrow("Reviewer access required");
    await expect(db.query("UPDATE public.note_submissions SET status='approved' WHERE id=$1", [id])).rejects.toThrow("permission denied");
  });
  it("does not expose another student's pending submission", async () => {
    await asUser(other);
    expect((await db.query("SELECT id FROM public.note_submissions")).rows).toHaveLength(0);
  });
  it("publishes a corrected snapshot only through an authorized reviewer", async () => {
    await asUser(reviewer);
    await review("approved");
    await asUser(null, "anon");
    const rows = await db.query<{ content: string; reviewer_name: string }>("SELECT content,reviewer_name FROM public.published_notes");
    expect(rows.rows[0]?.content).toBe(draft.content);
    expect(rows.rows[0]?.reviewer_name).toBe("Team reviewer");
  });
  it("keeps internal comments private from students", async () => {
    await asUser(student);
    expect((await db.query("SELECT internal_comments FROM public.note_review_details")).rows).toHaveLength(0);
    await asUser(reviewer);
    expect((await db.query<{ internal_comments: string }>("SELECT internal_comments FROM public.note_review_details")).rows[0]?.internal_comments).toBe("Private reviewer correction");
  });
  it("unpublishes requested changes and permits only owner resubmission", async () => {
    await asUser(reviewer); await review("needs_changes");
    await asUser(null, "anon");
    expect((await db.query("SELECT id FROM public.published_notes")).rows).toHaveLength(0);
    await asUser(other);
    await expect(db.query("SELECT public.submit_featured_note($1::jsonb,$2)", [JSON.stringify(draft), id])).rejects.toThrow("Only your submissions");
    await asUser(student);
    await db.query("SELECT public.submit_featured_note($1::jsonb,$2)", [JSON.stringify(draft), id]);
    expect((await db.query<{ status: string }>("SELECT status FROM public.note_submissions WHERE id=$1", [id])).rows[0]?.status).toBe("pending_review");
  });
  it("rejects empty notes and unauthenticated submissions", async () => {
    await asUser(student);
    await expect(db.query("SELECT public.submit_featured_note($1::jsonb)", [JSON.stringify({ ...draft, content: " " })])).rejects.toThrow("valid title, topic and notes content");
    await asUser(null, "anon");
    await expect(db.query("SELECT public.submit_featured_note($1::jsonb)", [JSON.stringify(draft)])).rejects.toThrow("permission denied");
  });
  it("blocks stale reviewer edits", async () => {
    await asUser(reviewer);
    await expect(db.query("SELECT public.review_featured_note($1,$2,$3::jsonb)", [id, "2020-01-01T00:00:00Z", JSON.stringify({ ...draft, status: "in_review" })])).rejects.toThrow("Submission changed");
  });
});