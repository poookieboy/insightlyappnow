-- Additive Notes library setup for the existing operator-managed database.
-- Apply only after inspecting that project's schema; no hosted backend provisioning.
-- Reuse existing roles where present. A missing role system starts with NO admins.
DO $$ BEGIN
  IF to_regtype('public.app_role') IS NULL THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NULL THEN
    EXECUTE $fn$CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS
      'SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)'$fn$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Notes users read own roles') THEN
    CREATE POLICY "Notes users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid()=user_id);
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
-- Personal user_notes and AI cache tables are intentionally unchanged.
CREATE TABLE public.note_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  grade text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'student' CHECK (kind IN ('student','ai')),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','in_review','needs_changes','approved','rejected')),
  student_feedback text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  CHECK (grade IN ('Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9')),
  CHECK (length(btrim(subject)) BETWEEN 1 AND 100),
  CHECK (length(btrim(topic)) BETWEEN 1 AND 160),
  CHECK (length(btrim(content)) BETWEEN 1 AND 40000),
  CHECK (length(source) <= 1000 AND length(display_name) <= 80 AND length(student_feedback) <= 2000)
);
GRANT SELECT ON public.note_submissions TO authenticated;
GRANT ALL ON public.note_submissions TO service_role;
ALTER TABLE public.note_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Submitters read their own submissions" ON public.note_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read the review queue" ON public.note_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX note_submissions_owner ON public.note_submissions(user_id, created_at DESC);
CREATE INDEX note_submissions_queue ON public.note_submissions(status, created_at DESC);

CREATE TABLE public.note_review_details (
  submission_id uuid PRIMARY KEY REFERENCES public.note_submissions(id) ON DELETE CASCADE,
  internal_comments text NOT NULL DEFAULT '' CHECK (length(internal_comments) <= 8000),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  reviewer_name text NOT NULL DEFAULT '' CHECK (length(reviewer_name) <= 80),
  reviewed_by uuid,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.note_review_details TO authenticated;
GRANT ALL ON public.note_review_details TO service_role;
ALTER TABLE public.note_review_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins read internal comments" ON public.note_review_details FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.published_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES public.note_submissions(id),
  title text NOT NULL,
  grade text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  kind text NOT NULL CHECK (kind IN ('ai','student')),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 1 AND 500),
  reviewer_name text NOT NULL CHECK (length(btrim(reviewer_name)) BETWEEN 1 AND 80),
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.published_notes TO anon, authenticated;
GRANT ALL ON public.published_notes TO service_role;
ALTER TABLE public.published_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readers see only published notes" ON public.published_notes FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE INDEX published_notes_filters ON public.published_notes(grade, subject, topic) WHERE is_published = true;

-- Users cannot insert/update any status, publication or private comment directly.
-- Definer functions below authenticate and authorize before each write.
CREATE FUNCTION public.validate_featured_note_payload(p jsonb) RETURNS void
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE level integer; common text[]; extra text[];
BEGIN
  IF p IS NULL OR jsonb_typeof(p) <> 'object' THEN RAISE EXCEPTION 'Invalid notes payload' USING ERRCODE='22023'; END IF;
  IF length(btrim(coalesce(p->>'title',''))) NOT BETWEEN 1 AND 160 OR
     length(btrim(coalesce(p->>'topic',''))) NOT BETWEEN 1 AND 160 OR
     length(btrim(coalesce(p->>'content',''))) NOT BETWEEN 1 AND 40000 OR
     length(coalesce(p->>'source','')) > 1000 OR length(coalesce(p->>'display_name','')) > 80 THEN
    RAISE EXCEPTION 'Provide a valid title, topic and notes content within the allowed limits' USING ERRCODE='22023';
  END IF;
  IF coalesce(p->>'grade','') !~ '^Grade [1-9]$' THEN RAISE EXCEPTION 'Choose a grade from 1 to 9' USING ERRCODE='22023'; END IF;
  level := right(p->>'grade',1)::integer;
  common := ARRAY['Mathematics','English','Kiswahili','Christian Religious Education','Islamic Religious Education','Hindu Religious Education'];
  IF level <= 3 THEN extra := ARRAY['Indigenous Language','Environmental Activities','Creative Activities'];
  ELSIF level <= 6 THEN extra := ARRAY['Science and Technology','Agriculture and Nutrition','Social Studies','Creative Arts'];
  ELSE extra := ARRAY['Integrated Science','Agriculture and Nutrition','Social Studies','Pre-Technical Studies','Creative Arts and Sports']; END IF;
  IF NOT (coalesce(p->>'subject','') = ANY(common || extra)) THEN RAISE EXCEPTION 'Choose a subject for this grade' USING ERRCODE='22023'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.validate_featured_note_payload(jsonb) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.submit_featured_note(p_payload jsonb, p_submission_id uuid DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid(); note_id uuid;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Please sign in' USING ERRCODE='42501'; END IF;
  PERFORM public.validate_featured_note_payload(p_payload);
  IF p_submission_id IS NULL THEN
    INSERT INTO public.note_submissions(user_id,title,grade,subject,topic,content,source,display_name)
    VALUES(actor,btrim(p_payload->>'title'),p_payload->>'grade',p_payload->>'subject',btrim(p_payload->>'topic'),btrim(p_payload->>'content'),coalesce(p_payload->>'source',''),coalesce(p_payload->>'display_name','')) RETURNING id INTO note_id;
  ELSE
    UPDATE public.note_submissions SET title=btrim(p_payload->>'title'),grade=p_payload->>'grade',subject=p_payload->>'subject',topic=btrim(p_payload->>'topic'),content=btrim(p_payload->>'content'),source=coalesce(p_payload->>'source',''),display_name=coalesce(p_payload->>'display_name',''),status='pending_review',student_feedback='',updated_at=clock_timestamp()
    WHERE id=p_submission_id AND user_id=actor AND status='needs_changes' AND kind='student' RETURNING id INTO note_id;
    IF note_id IS NULL THEN RAISE EXCEPTION 'Only your submissions needing changes may be resubmitted' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN note_id;
END; $$;
REVOKE ALL ON FUNCTION public.submit_featured_note(jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_featured_note(jsonb,uuid) TO authenticated;

CREATE FUNCTION public.create_featured_ai_draft(p_payload jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE note_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Reviewer access required' USING ERRCODE='42501'; END IF;
  PERFORM public.validate_featured_note_payload(p_payload);
  INSERT INTO public.note_submissions(user_id,title,grade,subject,topic,content,source,display_name,kind)
  VALUES(auth.uid(),btrim(p_payload->>'title'),p_payload->>'grade',p_payload->>'subject',btrim(p_payload->>'topic'),btrim(p_payload->>'content'),coalesce(p_payload->>'source',''),coalesce(p_payload->>'display_name',''),'ai') RETURNING id INTO note_id;
  RETURN note_id;
END; $$;
REVOKE ALL ON FUNCTION public.create_featured_ai_draft(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_featured_ai_draft(jsonb) TO authenticated;

CREATE FUNCTION public.review_featured_note(p_id uuid, p_expected_updated_at timestamptz, p_payload jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n public.note_submissions; target text := p_payload->>'status';
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Reviewer access required' USING ERRCODE='42501'; END IF;
  SELECT * INTO n FROM public.note_submissions WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found' USING ERRCODE='22023'; END IF;
  IF p_expected_updated_at IS NULL OR n.updated_at <> p_expected_updated_at THEN RAISE EXCEPTION 'Submission changed; refresh before saving' USING ERRCODE='40001'; END IF;
  PERFORM public.validate_featured_note_payload(p_payload);
  IF target IS NULL OR target NOT IN ('in_review','needs_changes','approved','rejected') THEN RAISE EXCEPTION 'Invalid review status' USING ERRCODE='22023'; END IF;
  IF length(coalesce(p_payload->>'internal_comments','')) > 8000 OR length(coalesce(p_payload->>'student_feedback','')) > 2000 THEN RAISE EXCEPTION 'Review comments exceed the allowed limit' USING ERRCODE='22023'; END IF;
  IF target IN ('needs_changes','rejected') AND length(btrim(coalesce(p_payload->>'student_feedback',''))) = 0 THEN RAISE EXCEPTION 'Add feedback for the student' USING ERRCODE='22023'; END IF;
  IF target='approved' AND (length(btrim(coalesce(p_payload->>'description',''))) NOT BETWEEN 1 AND 500 OR length(btrim(coalesce(p_payload->>'reviewer_name',''))) NOT BETWEEN 1 AND 80) THEN RAISE EXCEPTION 'Add description and reviewer attribution before publication' USING ERRCODE='22023'; END IF;
  UPDATE public.note_submissions SET title=btrim(p_payload->>'title'),grade=p_payload->>'grade',subject=p_payload->>'subject',topic=btrim(p_payload->>'topic'),content=btrim(p_payload->>'content'),source=coalesce(p_payload->>'source',''),display_name=coalesce(p_payload->>'display_name',''),status=target,student_feedback=coalesce(p_payload->>'student_feedback',''),updated_at=clock_timestamp() WHERE id=p_id RETURNING * INTO n;
  INSERT INTO public.note_review_details(submission_id,internal_comments,description,reviewer_name,reviewed_by,reviewed_at)
  VALUES(p_id,coalesce(p_payload->>'internal_comments',''),coalesce(p_payload->>'description',''),coalesce(p_payload->>'reviewer_name',''),auth.uid(),now()) ON CONFLICT(submission_id) DO UPDATE SET internal_comments=EXCLUDED.internal_comments,description=EXCLUDED.description,reviewer_name=EXCLUDED.reviewer_name,reviewed_by=EXCLUDED.reviewed_by,reviewed_at=EXCLUDED.reviewed_at;
  IF target='approved' THEN
    INSERT INTO public.published_notes(submission_id,title,grade,subject,topic,content,source,display_name,kind,description,reviewer_name,is_published,published_at)
    VALUES(n.id,n.title,n.grade,n.subject,n.topic,n.content,n.source,n.display_name,n.kind,btrim(p_payload->>'description'),btrim(p_payload->>'reviewer_name'),true,now())
    ON CONFLICT(submission_id) DO UPDATE SET title=EXCLUDED.title,grade=EXCLUDED.grade,subject=EXCLUDED.subject,topic=EXCLUDED.topic,content=EXCLUDED.content,source=EXCLUDED.source,display_name=EXCLUDED.display_name,description=EXCLUDED.description,reviewer_name=EXCLUDED.reviewer_name,is_published=true,published_at=now();
  ELSE
    UPDATE public.published_notes SET is_published=false WHERE submission_id=p_id;
  END IF;
  RETURN p_id;
END; $$;
REVOKE ALL ON FUNCTION public.review_featured_note(uuid,timestamptz,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_featured_note(uuid,timestamptz,jsonb) TO authenticated;