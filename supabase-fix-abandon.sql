-- Allow developers to delete their own project_developer assignments (abandon project)
DROP POLICY IF EXISTS "Internal users manage project developer assignments" ON project_developers;

CREATE POLICY "Internal users manage project developer assignments"
  ON project_developers FOR ALL
  TO authenticated
  USING (
    developer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.role::TEXT IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles viewer
      WHERE viewer.id = auth.uid()
        AND viewer.role::TEXT IN ('admin', 'manager')
    )
  );
