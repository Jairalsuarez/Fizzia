-- Allow the public landing estimator to create leads for the admin "Potenciales" view.
-- Run this in Supabase SQL editor if the landing request fails with an RLS error.

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public landing estimator creates leads" ON public.leads;
CREATE POLICY "Public landing estimator creates leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  source IN ('landing', 'landing_cta', 'landing_estimator', 'chat_widget')
  AND status = 'new'
);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

ALTER TABLE public.leads REPLICA IDENTITY FULL;
