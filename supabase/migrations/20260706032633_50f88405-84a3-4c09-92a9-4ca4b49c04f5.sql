
-- Categories table
CREATE TABLE IF NOT EXISTS public.note_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#fcd34d',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_categories TO authenticated;
GRANT ALL ON public.note_categories TO service_role;

ALTER TABLE public.note_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories" ON public.note_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_note_categories_updated
BEFORE UPDATE ON public.note_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_note_categories_user ON public.note_categories(user_id);

-- Extend user_notes
ALTER TABLE public.user_notes
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.note_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS background_style TEXT,
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS encrypted_payload TEXT;

CREATE INDEX IF NOT EXISTS idx_user_notes_category ON public.user_notes(category_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_updated ON public.user_notes(user_id, updated_at DESC);

-- Storage policies for note-attachments bucket (per-user folder = auth.uid()/...)
CREATE POLICY "Users read own note attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'note-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own note attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'note-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own note attachments" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'note-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own note attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'note-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
