-- ==========================================
-- FIX: Auto-crear cliente y perfil cuando alguien se registra (Google o email)
-- ==========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_new_client_id uuid;
BEGIN
  -- 1. Crear perfil (si no existe)
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::profile_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Si es un usuario nuevo (client), crear su registro en clients + client_users
  IF NOT EXISTS (SELECT 1 FROM public.client_users WHERE user_id = NEW.id) THEN
    -- Verificar si hay un usuario anterior con el mismo email
    SELECT id INTO v_existing_id
    FROM auth.users
    WHERE email = NEW.email AND id != NEW.id
    ORDER BY created_at
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      -- Heredar relaciones del usuario anterior
      INSERT INTO public.client_users (client_id, user_id)
      SELECT cu.client_id, NEW.id
      FROM public.client_users cu
      WHERE cu.user_id = v_existing_id
      ON CONFLICT DO NOTHING;
    ELSE
      -- Usuario completamente nuevo: crear cliente + link
      INSERT INTO public.clients (name, status)
      VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 'active')
      RETURNING id INTO v_new_client_id;

      INSERT INTO public.client_users (user_id, client_id)
      VALUES (NEW.id, v_new_client_id);
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
