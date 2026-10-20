import { describe, expect, it } from "vitest";
import { canResubmit, filterPublishedNotes, noteSubmissionSchema, noteSubjects, type PublishedNote } from "./featured-notes";

const draft = { title: "Fractions", grade: "Grade 5", subject: "Mathematics", topic: "Fractions", content: "## Key points\nEqual parts form a whole.", source: "Class lesson", display_name: "Contributor" };
const note: PublishedNote = { ...draft, id: "note-one", kind: "student", description: "Fraction revision", reviewer_name: "Reviewer", published_at: "2026-10-20" };
describe("Notes rules", () => {
  it("rejects empty student content", () => { expect(noteSubmissionSchema.safeParse({ ...draft, content: "   " }).success).toBe(false); });
  it("requires a title", () => { expect(noteSubmissionSchema.safeParse({ ...draft, title: " " }).success).toBe(false); });
  it("requires a topic", () => { expect(noteSubmissionSchema.safeParse({ ...draft, topic: "" }).success).toBe(false); });
  it("accepts CBC Grades 1–9 but not Grade 10", () => { expect(noteSubmissionSchema.safeParse({ ...draft, grade: "Grade 9" }).success).toBe(true); expect(noteSubmissionSchema.safeParse({ ...draft, grade: "Grade 10" }).success).toBe(false); });
  it("rejects mismatched learning areas", () => { expect(noteSubmissionSchema.safeParse({ ...draft, grade: "Grade 1", subject: "Integrated Science" }).success).toBe(false); expect(noteSubjects("Grade 8")).toContain("Integrated Science"); });
  it("filters the same library by grade subject topic and search", () => { expect(filterPublishedNotes([note], { grade: "Grade 5", subject: "Mathematics", topic: "Fractions", search: " EQUAL " })).toEqual([note]); expect(filterPublishedNotes([note], { grade: "Grade 6", subject: "", topic: "", search: "" })).toEqual([]); });
  it("allows resubmission only when changes were requested", () => { expect(canResubmit("needs_changes")).toBe(true); for (const status of ["pending_review", "in_review", "approved", "rejected"] as const) expect(canResubmit(status)).toBe(false); });
});