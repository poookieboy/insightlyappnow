-- Lock down the new-user trigger function so only Postgres (the trigger) can run it
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Make the avatars bucket "not listable" but still publicly readable per-object
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop the broad public select policy and replace with one that only allows
-- reading specific objects in the avatars bucket (no LIST without naming).
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

CREATE POLICY "Avatar objects are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
