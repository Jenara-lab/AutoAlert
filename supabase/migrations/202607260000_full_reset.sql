-- AutoAlert — Idempotent migration. Run ONCE in Supabase SQL Editor.
-- Uses IF NOT EXISTS so it's safe to re-run.

-- =========================================================================
-- Enums (skip if already exist)
-- =========================================================================

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('owner', 'mechanic');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.maintenance_type AS ENUM (
    'oil_change', 'filter_change', 'brake_change', 'tire_change',
    'battery_change', 'tune_up', 'general_repair'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.operating_expense_type AS ENUM ('fuel', 'insurance', 'registration');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_kind AS ENUM (
    'maintenance_date', 'maintenance_mileage',
    'insurance_expiry', 'registration_expiry'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_status AS ENUM ('pending', 'read', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_channel AS ENUM ('in_app', 'email', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================================
-- Helper function
-- =========================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- =========================================================================
-- Profiles
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  phone text CHECK (phone IS NULL OR char_length(phone) <= 30),
  role public.user_role NOT NULL DEFAULT 'owner',
  currency_code char(3) NOT NULL DEFAULT 'HNL',
  email text UNIQUE,
  email_alerts_enabled boolean NOT NULL DEFAULT true,
  whatsapp_alerts_enabled boolean NOT NULL DEFAULT false,
  date_lead_days int NOT NULL DEFAULT 15,
  mileage_threshold_km int NOT NULL DEFAULT 300,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Profiles are readable by their owner"
    ON public.profiles FOR SELECT TO authenticated
    USING ((select auth.uid()) = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Profiles are insertable by their owner"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Profiles are editable by their owner"
    ON public.profiles FOR UPDATE TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Auto-create profile on signup
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Usuario'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    CASE WHEN new.raw_user_meta_data ->> 'role' = 'mechanic'
         THEN 'mechanic'::public.user_role
         ELSE 'owner'::public.user_role END
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- Vehicles
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plate            varchar(20) NOT NULL,
  normalized_plate varchar(20) NOT NULL,
  make             varchar(80) NOT NULL,
  model            varchar(80) NOT NULL,
  year             int NOT NULL,
  vin              varchar(17),
  current_mileage  int NOT NULL DEFAULT 0 CHECK (current_mileage >= 0),
  fuel_type        varchar(30) NOT NULL,
  deleted_at       timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_owner_plate_unique UNIQUE (owner_id, normalized_plate),
  CONSTRAINT vehicles_vin_unique UNIQUE (vin)
);

CREATE INDEX IF NOT EXISTS vehicles_owner_id_idx         ON public.vehicles (owner_id);
CREATE INDEX IF NOT EXISTS vehicles_normalized_plate_idx ON public.vehicles (normalized_plate);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owner manages own vehicles"
    ON public.vehicles FOR ALL TO authenticated
    USING ((select auth.uid()) = owner_id)
    WITH CHECK ((select auth.uid()) = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Mechanic reads linked vehicles"
    ON public.vehicles FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.vehicle_workshops vw
      JOIN public.workshops w ON w.id = vw.workshop_id
      WHERE vw.vehicle_id = vehicles.id
        AND vw.active = true AND w.mechanic_id = (select auth.uid()) AND w.deleted_at IS NULL
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS vehicles_set_updated_at ON public.vehicles;
CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Workshops
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.workshops (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mechanic_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        varchar(120) NOT NULL,
  address     varchar(255),
  phone       varchar(30),
  manager     varchar(120),
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workshops_mechanic_id_idx ON public.workshops (mechanic_id);

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Mechanic manages own workshops"
    ON public.workshops FOR ALL TO authenticated
    USING ((select auth.uid()) = mechanic_id)
    WITH CHECK ((select auth.uid()) = mechanic_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated reads active workshops"
    ON public.workshops FOR SELECT TO authenticated
    USING (deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS workshops_set_updated_at ON public.workshops;
CREATE TRIGGER workshops_set_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Vehicle–Workshop links
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.vehicle_workshops (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_workshops_unique UNIQUE (vehicle_id, workshop_id)
);

CREATE INDEX IF NOT EXISTS vehicle_workshops_vehicle_id_idx  ON public.vehicle_workshops (vehicle_id);
CREATE INDEX IF NOT EXISTS vehicle_workshops_workshop_id_idx ON public.vehicle_workshops (workshop_id);

ALTER TABLE public.vehicle_workshops ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owner manages links for own vehicles"
    ON public.vehicle_workshops FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_workshops.vehicle_id AND v.owner_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = vehicle_workshops.vehicle_id AND v.owner_id = (select auth.uid())
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Mechanic reads links for own workshops"
    ON public.vehicle_workshops FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.workshops w
      WHERE w.id = vehicle_workshops.workshop_id
        AND w.mechanic_id = (select auth.uid()) AND w.deleted_at IS NULL
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS vehicle_workshops_set_updated_at ON public.vehicle_workshops;
CREATE TRIGGER vehicle_workshops_set_updated_at
  BEFORE UPDATE ON public.vehicle_workshops
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Mileage logs
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.mileage_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  recorder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mileage     int NOT NULL CHECK (mileage >= 0),
  date        date NOT NULL,
  note        varchar(1000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mileage_logs_vehicle_id_idx  ON public.mileage_logs (vehicle_id);
CREATE INDEX IF NOT EXISTS mileage_logs_recorder_id_idx ON public.mileage_logs (recorder_id);
CREATE INDEX IF NOT EXISTS mileage_logs_date_idx        ON public.mileage_logs (date);

ALTER TABLE public.mileage_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owner manages own mileage logs"
    ON public.mileage_logs FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = mileage_logs.vehicle_id AND v.owner_id = (select auth.uid())
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = mileage_logs.vehicle_id AND v.owner_id = (select auth.uid())
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Mechanic reads mileage for linked vehicles"
    ON public.mileage_logs FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.vehicle_workshops vw
      JOIN public.workshops w ON w.id = vw.workshop_id
      WHERE vw.vehicle_id = mileage_logs.vehicle_id
        AND vw.active = true AND w.mechanic_id = (select auth.uid()) AND w.deleted_at IS NULL
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS mileage_logs_set_updated_at ON public.mileage_logs;
CREATE TRIGGER mileage_logs_set_updated_at
  BEFORE UPDATE ON public.mileage_logs
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Maintenance records
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id            uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  workshop_id           uuid REFERENCES public.workshops(id) ON DELETE SET NULL,
  creator_id            uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type                  public.maintenance_type NOT NULL,
  mileage               int NOT NULL CHECK (mileage >= 0),
  service_date          date NOT NULL,
  description           varchar(1000),
  cost_total            numeric(12,2) CHECK (cost_total IS NULL OR cost_total >= 0),
  cost_labor            numeric(12,2) CHECK (cost_labor IS NULL OR cost_labor >= 0),
  cost_parts            numeric(12,2) CHECK (cost_parts IS NULL OR cost_parts >= 0),
  next_service_date     date,
  next_service_mileage  int CHECK (next_service_mileage IS NULL OR next_service_mileage >= 0),
  deleted_at            timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_records_vehicle_id_idx          ON public.maintenance_records (vehicle_id);
CREATE INDEX IF NOT EXISTS maintenance_records_workshop_id_idx         ON public.maintenance_records (workshop_id);
CREATE INDEX IF NOT EXISTS maintenance_records_creator_id_idx          ON public.maintenance_records (creator_id);
CREATE INDEX IF NOT EXISTS maintenance_records_service_date_idx        ON public.maintenance_records (service_date);
CREATE INDEX IF NOT EXISTS maintenance_records_next_service_date_idx   ON public.maintenance_records (next_service_date);
CREATE INDEX IF NOT EXISTS maintenance_records_next_service_mileage_idx ON public.maintenance_records (next_service_mileage);

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owner manages own maintenance"
    ON public.maintenance_records FOR ALL TO authenticated
    USING ((select auth.uid()) = creator_id)
    WITH CHECK ((select auth.uid()) = creator_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Owner reads workshop maintenance for linked vehicles"
    ON public.maintenance_records FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = maintenance_records.vehicle_id AND v.owner_id = (select auth.uid())
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Mechanic manages maintenance through own workshops"
    ON public.maintenance_records FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.workshops w
      WHERE w.id = maintenance_records.workshop_id
        AND w.mechanic_id = (select auth.uid()) AND w.deleted_at IS NULL
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.workshops w
      WHERE w.id = maintenance_records.workshop_id
        AND w.mechanic_id = (select auth.uid()) AND w.deleted_at IS NULL
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: validate mechanic must use owned workshop + active vehicle link
CREATE OR REPLACE FUNCTION public.validate_maintenance_workshop()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
  workshop_owner uuid;
  link_active boolean;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = (select auth.uid());

  IF v_role = 'mechanic' THEN
    IF new.workshop_id IS NULL THEN
      RAISE EXCEPTION 'Mechanic must select a workshop.';
    END IF;

    SELECT mechanic_id INTO workshop_owner FROM public.workshops WHERE id = new.workshop_id;
    IF workshop_owner != (select auth.uid()) THEN
      RAISE EXCEPTION 'Workshop does not belong to you.';
    END IF;

    SELECT active INTO link_active FROM public.vehicle_workshops
    WHERE vehicle_id = new.vehicle_id AND workshop_id = new.workshop_id;
    IF coalesce(link_active, false) = false THEN
      RAISE EXCEPTION 'Vehicle is not actively linked to this workshop.';
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS maintenance_validate_workshop ON public.maintenance_records;
CREATE TRIGGER maintenance_validate_workshop
  BEFORE INSERT OR UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE PROCEDURE public.validate_maintenance_workshop();

DROP TRIGGER IF EXISTS maintenance_records_set_updated_at ON public.maintenance_records;
CREATE TRIGGER maintenance_records_set_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Operating expenses
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.operating_expenses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id     uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  creator_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           public.operating_expense_type NOT NULL,
  amount         numeric(12,2) NOT NULL CHECK (amount > 0),
  date           date NOT NULL,
  notes          varchar(1000),
  fuel_quantity  numeric(10,2) CHECK (fuel_quantity IS NULL OR fuel_quantity >= 0),
  fuel_unit      varchar(10),
  fuel_station   varchar(120),
  fuel_address   varchar(255),
  due_date       date,
  term_months    int CHECK (term_months IS NULL OR term_months IN (3, 6, 12)),
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expenses_due_xor_term CHECK (
    type IN ('fuel', 'insurance', 'registration')
    AND (
      (type = 'fuel')
      OR (due_date IS NOT NULL AND term_months IS NULL)
      OR (due_date IS NULL AND term_months IS NOT NULL)
    )
  )
);

CREATE INDEX IF NOT EXISTS operating_expenses_vehicle_id_idx ON public.operating_expenses (vehicle_id);
CREATE INDEX IF NOT EXISTS operating_expenses_creator_id_idx ON public.operating_expenses (creator_id);
CREATE INDEX IF NOT EXISTS operating_expenses_type_idx       ON public.operating_expenses (type);
CREATE INDEX IF NOT EXISTS operating_expenses_due_date_idx   ON public.operating_expenses (due_date);
CREATE INDEX IF NOT EXISTS operating_expenses_date_idx       ON public.operating_expenses (date);

ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Owner manages own operating expenses"
    ON public.operating_expenses FOR ALL TO authenticated
    USING ((select auth.uid()) = creator_id)
    WITH CHECK ((select auth.uid()) = creator_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Mechanic reads expenses for linked vehicles"
    ON public.operating_expenses FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.vehicle_workshops vw
      JOIN public.workshops w ON w.id = vw.workshop_id
      WHERE vw.vehicle_id = operating_expenses.vehicle_id
        AND vw.active = true AND w.mechanic_id = (select auth.uid()) AND w.deleted_at IS NULL
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS operating_expenses_set_updated_at ON public.operating_expenses;
CREATE TRIGGER operating_expenses_set_updated_at
  BEFORE UPDATE ON public.operating_expenses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Alerts
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id       uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  source_record_id uuid,
  source_type      varchar(40),
  kind             public.alert_kind NOT NULL,
  channel          public.alert_channel NOT NULL DEFAULT 'in_app',
  status           public.alert_status NOT NULL DEFAULT 'pending',
  title            varchar(200) NOT NULL,
  message          varchar(1000) NOT NULL,
  due_date         date,
  due_mileage      int,
  service_type     varchar(40),
  sent_at          timestamptz,
  read_at          timestamptz,
  error_detail     varchar(500),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alerts_dedup UNIQUE (source_record_id, recipient_id, channel)
);

CREATE INDEX IF NOT EXISTS alerts_recipient_id_idx     ON public.alerts (recipient_id);
CREATE INDEX IF NOT EXISTS alerts_vehicle_id_idx       ON public.alerts (vehicle_id);
CREATE INDEX IF NOT EXISTS alerts_source_record_id_idx ON public.alerts (source_record_id);
CREATE INDEX IF NOT EXISTS alerts_kind_idx             ON public.alerts (kind);
CREATE INDEX IF NOT EXISTS alerts_status_idx           ON public.alerts (status);
CREATE INDEX IF NOT EXISTS alerts_due_date_idx         ON public.alerts (due_date);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Recipient manages own alerts"
    ON public.alerts FOR ALL TO authenticated
    USING ((select auth.uid()) = recipient_id)
    WITH CHECK ((select auth.uid()) = recipient_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS alerts_set_updated_at ON public.alerts;
CREATE TRIGGER alerts_set_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================================================================
-- Mileage guard — cannot decrease
-- =========================================================================

CREATE OR REPLACE FUNCTION public.guard_mileage_no_decrease()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  latest_mileage int;
BEGIN
  SELECT current_mileage INTO latest_mileage
  FROM public.vehicles WHERE id = new.vehicle_id;

  IF new.mileage < coalesce(latest_mileage, 0) THEN
    RAISE EXCEPTION 'Mileage cannot be lower than the current vehicle mileage (%)', latest_mileage;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS mileage_logs_guard_no_decrease ON public.mileage_logs;
CREATE TRIGGER mileage_logs_guard_no_decrease
  BEFORE INSERT ON public.mileage_logs
  FOR EACH ROW EXECUTE PROCEDURE public.guard_mileage_no_decrease();

-- =========================================================================
-- Update vehicle mileage after new log
-- =========================================================================

CREATE OR REPLACE FUNCTION public.update_vehicle_mileage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.vehicles
  SET current_mileage = new.mileage, updated_at = now()
  WHERE id = new.vehicle_id AND current_mileage < new.mileage;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS mileage_logs_update_vehicle_mileage ON public.mileage_logs;
CREATE TRIGGER mileage_logs_update_vehicle_mileage
  AFTER INSERT ON public.mileage_logs
  FOR EACH ROW EXECUTE PROCEDURE public.update_vehicle_mileage();
