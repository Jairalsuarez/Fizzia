-- Fix client delete RLS policy for payments
-- The current policy only checks client_id on the payment row,
-- which fails for older payments where client_id is NULL.
-- This allows deletion via project ownership too.

DROP POLICY IF EXISTS "Clients delete own rejected payments" ON payments;

CREATE POLICY "Clients delete own rejected payments"
  ON payments FOR DELETE
  USING (
    admin_status = 'rejected'
    AND (
      client_id = (SELECT client_id FROM client_users WHERE user_id = auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM projects p
        JOIN client_users cu ON cu.client_id = p.client_id
        WHERE p.id = payments.project_id AND cu.user_id = auth.uid()
      )
    )
  );
