-- 1. Curriculum notes cache is written and read only by server-side code using the
-- service key; remove the unused allow-all read rule and its grants.
DROP POLICY IF EXISTS "read_curriculum_notes" ON public.ai_curriculum_notes;
REVOKE SELECT ON public.ai_curriculum_notes FROM anon, authenticated;

-- 2. Profiles: replace the read-everything rule with owner and admin reads.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
REVOKE SELECT ON public.profiles FROM anon;

-- 3. Avatars: profile pictures stay publicly viewable through the bucket's public
-- links; restrict the file API to each user's own folder instead of everyone.
DROP POLICY IF EXISTS "Avatar objects are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatar files by path" ON storage.objects;
CREATE POLICY "Users can read their own avatar files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );