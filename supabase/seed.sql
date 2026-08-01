-- AutoAlert seed data for development and demo.
-- Run AFTER migrations. Supabase: use the SQL Editor or `supabase db reset`.

-- ---------------------------------------------------------------------------
-- Profiles (passwords are hashed placeholder values — use Supabase Auth UI
-- or the signup flow to create real users, then run this to backfill.)
-- ---------------------------------------------------------------------------

-- Owner demo
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'owner@demo.com',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"full_name":"Carlos López","phone":"+50499001122","role":"owner"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, phone, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'owner@demo.com',
  'Carlos López',
  '+50499001122',
  'owner'
) ON CONFLICT (id) DO NOTHING;

-- Mechanic demo
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'mechanic@demo.com',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"full_name":"María García","phone":"+50499112233","role":"mechanic"}'::jsonb,
  now(), now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, phone, role)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'mechanic@demo.com',
  'María García',
  '+50499112233',
  'mechanic'
) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Vehicles (owner)
-- ---------------------------------------------------------------------------

INSERT INTO public.vehicles (id, owner_id, plate, normalized_plate, make, model, year, vin, current_mileage, fuel_type)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'ABC 123', 'ABC123', 'Toyota', 'Corolla', 2021, '1HGBH41JXMN109186', 0, 'Gasolina'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'XYZ 789', 'XYZ789', 'Honda', 'Civic', 2019, null, 0, 'Gasolina')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Workshops (mechanic)
-- ---------------------------------------------------------------------------

INSERT INTO public.workshops (id, mechanic_id, name, address, phone, manager)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'Taller García', 'Col. Palmira, 3ra calle', '+50422334455', 'María García')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Vehicle–Workshop links
-- ---------------------------------------------------------------------------

INSERT INTO public.vehicle_workshops (vehicle_id, workshop_id, active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', true)
ON CONFLICT (vehicle_id, workshop_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Mileage logs
-- ---------------------------------------------------------------------------

INSERT INTO public.mileage_logs (vehicle_id, recorder_id, mileage, date, note)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   44000, '2026-06-15', null),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   45000, '2026-07-20', 'Cambio de aceite')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Maintenance records
-- ---------------------------------------------------------------------------

INSERT INTO public.maintenance_records (id, vehicle_id, workshop_id, creator_id, type, mileage, service_date, cost_labor, cost_parts, next_service_date, next_service_mileage)
VALUES
  ('d0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000002',
   'oil_change', 45000, '2026-07-20', 300, 450,
   '2026-10-20', 50000)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Operating expenses
-- ---------------------------------------------------------------------------

INSERT INTO public.operating_expenses (id, vehicle_id, creator_id, type, amount, date, fuel_quantity, fuel_unit, fuel_station)
VALUES
  ('e0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'fuel', 1200, '2026-07-18', 35, 'Litros', 'Petrolera La Paz')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.operating_expenses (id, vehicle_id, creator_id, type, amount, date, due_date)
VALUES
  ('e0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'insurance', 8500, '2026-07-01', '2026-12-01')
ON CONFLICT (id) DO NOTHING;
