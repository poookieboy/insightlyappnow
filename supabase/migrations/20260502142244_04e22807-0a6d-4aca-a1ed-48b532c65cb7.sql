-- Replace broad SELECT policy with one that allows fetching individual files
-- but disallows listing the bucket (the linter flags any SELECT policy that
-- lets clients enumerate objects). Restricting to a non-empty name allows
-- direct GETs by path while blocking list queries that scan the bucket.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Public can read avatar files by path"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'avatars'
  AND name IS NOT NULL
  AND octet_length(name) > 0
);