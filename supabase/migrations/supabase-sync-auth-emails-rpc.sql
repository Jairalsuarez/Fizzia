-- Sync legacy profile emails from auth.users for old Google/email accounts.
CREATE OR REPLACE FUNCTION public.sync_missing_profile_emails()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
    AND u.email IS NOT NULL
    AND u.email <> ''
    AND (p.email IS NULL OR p.email = '');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_missing_profile_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_missing_profile_emails() TO authenticated;
