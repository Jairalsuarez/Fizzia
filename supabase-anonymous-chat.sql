-- Anonymous chat tables for landing page visitors
-- Separate from the authenticated messages system to avoid breaking existing RLS

CREATE TABLE IF NOT EXISTS anonymous_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  visitor_name TEXT NOT NULL,
  visitor_last_name TEXT,
  visitor_city TEXT,
  visitor_country TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  dial_code TEXT,
  simulator_data JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anonymous_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES anonymous_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_from_visitor BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anon_msg_conv ON anonymous_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_anon_conv_session ON anonymous_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_anon_conv_status ON anonymous_conversations(status);

-- Enable realtime for anonymous messages (so admin gets live updates)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;
ALTER TABLE anonymous_messages REPLICA IDENTITY FULL;

ALTER TABLE anonymous_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_messages ENABLE ROW LEVEL SECURITY;

-- Visitors: can create conversations
DROP POLICY IF EXISTS "anon_conv_insert" ON anonymous_conversations;
CREATE POLICY "anon_conv_insert" ON anonymous_conversations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Visitors: can view conversations (filtered by session_id in app)
DROP POLICY IF EXISTS "anon_conv_select" ON anonymous_conversations;
CREATE POLICY "anon_conv_select" ON anonymous_conversations
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admins: full access
DROP POLICY IF EXISTS "anon_conv_admin" ON anonymous_conversations;
CREATE POLICY "anon_conv_admin" ON anonymous_conversations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Visitors: can insert messages
DROP POLICY IF EXISTS "anon_msg_insert_visitor" ON anonymous_messages;
CREATE POLICY "anon_msg_insert_visitor" ON anonymous_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (is_from_visitor = true);

-- Visitors: can read messages (filtered by conversation_id in app)
DROP POLICY IF EXISTS "anon_msg_select" ON anonymous_messages;
CREATE POLICY "anon_msg_select" ON anonymous_messages
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admins: full access to messages
DROP POLICY IF EXISTS "anon_msg_admin" ON anonymous_messages;
CREATE POLICY "anon_msg_admin" ON anonymous_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
