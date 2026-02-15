-- Migration: Create notifications table and triggers
-- Date: 2026-02-15
-- Description: Activity feed notifications with automatic FIFO queue management (max 6 items)

-- Step 1: Create notifications table
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('stock', 'theme', 'bucket')),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated')),
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_creator_fkey FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Step 2: Create index for faster queries (ordered by created_at DESC)
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Step 3: Enable RLS (Row Level Security) for Supabase Realtime
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy to allow all authenticated users to read notifications
CREATE POLICY "Allow authenticated users to read notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Create RLS policy to allow only admins to insert notifications
CREATE POLICY "Allow admins to insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_metadata
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 6: Function to maintain max 6 notifications (FIFO queue)
CREATE OR REPLACE FUNCTION maintain_notification_queue()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest notifications if we have more than 6
  DELETE FROM notifications
  WHERE id IN (
    SELECT id FROM notifications
    ORDER BY created_at ASC
    LIMIT GREATEST(0, (SELECT COUNT(*) FROM notifications) - 6)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Trigger to maintain queue after insert
CREATE TRIGGER trigger_maintain_notification_queue
AFTER INSERT ON notifications
FOR EACH STATEMENT
EXECUTE FUNCTION maintain_notification_queue();

-- Step 8: Function to generate notification IDs
CREATE OR REPLACE FUNCTION generate_notification_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'n' || encode(gen_random_bytes(12), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Step 9: Function to create notification for stock changes
CREATE OR REPLACE FUNCTION notify_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification
  INSERT INTO notifications (id, entity_type, action, entity_id, entity_name, created_by, created_at)
  VALUES (
    generate_notification_id(),
    'stock',
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END,
    NEW.id,
    NEW.symbol || ' - ' || NEW.company_name,
    NEW.created_by,
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Function to create notification for theme changes
CREATE OR REPLACE FUNCTION notify_theme_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (id, entity_type, action, entity_id, entity_name, created_by, created_at)
  VALUES (
    generate_notification_id(),
    'theme',
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END,
    NEW.id,
    NEW.name,
    NEW.created_by,
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Function to create notification for bucket changes
CREATE OR REPLACE FUNCTION notify_bucket_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (id, entity_type, action, entity_id, entity_name, created_by, created_at)
  VALUES (
    generate_notification_id(),
    'bucket',
    CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'updated' END,
    NEW.id,
    NEW.name,
    NEW.created_by,
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create triggers for stocks
CREATE TRIGGER trigger_notify_stock_insert
AFTER INSERT ON stocks
FOR EACH ROW
EXECUTE FUNCTION notify_stock_change();

CREATE TRIGGER trigger_notify_stock_update
AFTER UPDATE ON stocks
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION notify_stock_change();

-- Step 13: Create triggers for themes
CREATE TRIGGER trigger_notify_theme_insert
AFTER INSERT ON themes
FOR EACH ROW
EXECUTE FUNCTION notify_theme_change();

CREATE TRIGGER trigger_notify_theme_update
AFTER UPDATE ON themes
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION notify_theme_change();

-- Step 14: Create triggers for buckets
CREATE TRIGGER trigger_notify_bucket_insert
AFTER INSERT ON buckets
FOR EACH ROW
EXECUTE FUNCTION notify_bucket_change();

CREATE TRIGGER trigger_notify_bucket_update
AFTER UPDATE ON buckets
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION notify_bucket_change();
