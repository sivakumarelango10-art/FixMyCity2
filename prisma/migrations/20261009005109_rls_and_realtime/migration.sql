-- Enable RLS on all application tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complaints" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complaint_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complaint_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demo_payment_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demo_payment_method_services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demo_payment_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "upload_intents" ENABLE ROW LEVEL SECURITY;

-- Ensure authenticated role exists (for Supabase and local compatibility)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
END $$;

-- Safe check for auth schema functions
CREATE SCHEMA IF NOT EXISTS auth;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'uid' AND pronamespace = 'auth'::regnamespace
  ) THEN
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$
      SELECT NULL::uuid;
    $f$;
  END IF;
END $$;

-- Realtime policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_select_policy'
  ) THEN
    CREATE POLICY notifications_select_policy ON "notifications"
      FOR SELECT
      TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'complaint_events' AND policyname = 'complaint_events_select_policy'
  ) THEN
    CREATE POLICY complaint_events_select_policy ON "complaint_events"
      FOR SELECT
      TO authenticated
      USING (citizen_id = (SELECT auth.uid()) AND visibility = 'PUBLIC');
  END IF;
END $$;

-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE "notifications" REPLICA IDENTITY FULL;
ALTER TABLE "complaint_events" REPLICA IDENTITY FULL;

-- Add to supabase_realtime publication if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE "notifications";
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE "complaint_events";
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
