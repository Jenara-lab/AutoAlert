-- AutoAlert Sprint 2-4: core records, services, expenses, alerts, RLS.
-- Depends on: 202607260001_foundation.sql (profiles, user_role, triggers).
-- Run in Supabase SQL Editor or with Supabase CLI.

-- =========================================================================
-- 1. New enums
-- =========================================================================

create type public.maintenance_type as enum (
  'oil_change', 'filter_change', 'brake_change', 'tire_change',
  'battery_change', 'tune_up', 'general_repair'
);

create type public.operating_expense_type as enum (
  'fuel', 'insurance', 'registration'
);

create type public.alert_kind as enum (
  'maintenance_date', 'maintenance_mileage',
  'insurance_expiry', 'registration_expiry'
);

create type public.alert_status as enum (
  'pending', 'read', 'sent', 'failed'
);

create type public.alert_channel as enum (
  'in_app', 'email', 'whatsapp'
);

-- =========================================================================
-- 2. Alter profiles — add missing columns from Prisma schema
-- =========================================================================

alter table public.profiles
  add column if not exists email text unique,
  add column if not exists date_lead_days int not null default 15,
  add column if not exists mileage_threshold_km int not null default 300;

-- =========================================================================
-- 3. Vehicles
-- =========================================================================

create table public.vehicles (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  plate           varchar(20) not null,
  normalized_plate varchar(20) not null,
  make            varchar(80) not null,
  model           varchar(80) not null,
  year            int not null,
  vin             varchar(17),
  current_mileage int not null default 0
                    check (current_mileage >= 0),
  fuel_type       varchar(30) not null,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint vehicles_owner_plate_unique unique (owner_id, normalized_plate),
  constraint vehicles_vin_unique unique (vin)
);

create index vehicles_owner_id_idx     on public.vehicles (owner_id);
create index vehicles_normalized_plate_idx on public.vehicles (normalized_plate);

alter table public.vehicles enable row level security;

create policy "Owner manages own vehicles"
  on public.vehicles for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Mechanic reads linked vehicles"
  on public.vehicles for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicle_workshops vw
      join public.workshops w on w.id = vw.workshop_id
      where vw.vehicle_id = vehicles.id
        and vw.active = true
        and w.mechanic_id = (select auth.uid())
        and w.deleted_at is null
    )
  );

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- 4. Workshops
-- =========================================================================

create table public.workshops (
  id          uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references public.profiles(id) on delete cascade,
  name        varchar(120) not null,
  address     varchar(255),
  phone       varchar(30),
  manager     varchar(120),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index workshops_mechanic_id_idx on public.workshops (mechanic_id);

alter table public.workshops enable row level security;

create policy "Mechanic manages own workshops"
  on public.workshops for all
  to authenticated
  using ((select auth.uid()) = mechanic_id)
  with check ((select auth.uid()) = mechanic_id);

create policy "Authenticated reads active workshops"
  on public.workshops for select
  to authenticated
  using (deleted_at is null);

create trigger workshops_set_updated_at
  before update on public.workshops
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- 5. Vehicle–Workshop links
-- =========================================================================

create table public.vehicle_workshops (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint vehicle_workshops_unique unique (vehicle_id, workshop_id)
);

create index vehicle_workshops_vehicle_id_idx  on public.vehicle_workshops (vehicle_id);
create index vehicle_workshops_workshop_id_idx on public.vehicle_workshops (workshop_id);

alter table public.vehicle_workshops enable row level security;

create policy "Owner manages links for own vehicles"
  on public.vehicle_workshops for all
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_workshops.vehicle_id
        and v.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_workshops.vehicle_id
        and v.owner_id = (select auth.uid())
    )
  );

create policy "Mechanic reads links for own workshops"
  on public.vehicle_workshops for select
  to authenticated
  using (
    exists (
      select 1 from public.workshops w
      where w.id = vehicle_workshops.workshop_id
        and w.mechanic_id = (select auth.uid())
        and w.deleted_at is null
    )
  );

create trigger vehicle_workshops_set_updated_at
  before update on public.vehicle_workshops
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- 6. Mileage logs
-- =========================================================================

create table public.mileage_logs (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.vehicles(id) on delete cascade,
  recorder_id uuid not null references public.profiles(id) on delete cascade,
  mileage     int not null check (mileage >= 0),
  date        date not null,
  note        varchar(1000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index mileage_logs_vehicle_id_idx  on public.mileage_logs (vehicle_id);
create index mileage_logs_recorder_id_idx on public.mileage_logs (recorder_id);
create index mileage_logs_date_idx        on public.mileage_logs (date);

alter table public.mileage_logs enable row level security;

create policy "Owner manages own mileage logs"
  on public.mileage_logs for all
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = mileage_logs.vehicle_id
        and v.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = mileage_logs.vehicle_id
        and v.owner_id = (select auth.uid())
    )
  );

create policy "Mechanic reads mileage for linked vehicles"
  on public.mileage_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicle_workshops vw
      join public.workshops w on w.id = vw.workshop_id
      where vw.vehicle_id = mileage_logs.vehicle_id
        and vw.active = true
        and w.mechanic_id = (select auth.uid())
        and w.deleted_at is null
    )
  );

create trigger mileage_logs_set_updated_at
  before update on public.mileage_logs
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- 7. Maintenance records
-- =========================================================================

create table public.maintenance_records (
  id                    uuid primary key default gen_random_uuid(),
  vehicle_id            uuid not null references public.vehicles(id) on delete cascade,
  workshop_id           uuid references public.workshops(id) on delete set null,
  creator_id            uuid not null references public.profiles(id) on delete cascade,
  type                  public.maintenance_type not null,
  mileage               int not null check (mileage >= 0),
  service_date          date not null,
  description           varchar(1000),
  cost_total            numeric(12,2) check (cost_total is null or cost_total >= 0),
  cost_labor            numeric(12,2) check (cost_labor is null or cost_labor >= 0),
  cost_parts            numeric(12,2) check (cost_parts is null or cost_parts >= 0),
  next_service_date     date,
  next_service_mileage  int check (next_service_mileage is null or next_service_mileage >= 0),
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index maintenance_records_vehicle_id_idx      on public.maintenance_records (vehicle_id);
create index maintenance_records_workshop_id_idx     on public.maintenance_records (workshop_id);
create index maintenance_records_creator_id_idx      on public.maintenance_records (creator_id);
create index maintenance_records_service_date_idx    on public.maintenance_records (service_date);
create index maintenance_records_next_service_date_idx on public.maintenance_records (next_service_date);
create index maintenance_records_next_service_mileage_idx on public.maintenance_records (next_service_mileage);

alter table public.maintenance_records enable row level security;

create policy "Owner manages own maintenance"
  on public.maintenance_records for all
  to authenticated
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

create policy "Owner reads workshop maintenance for linked vehicles"
  on public.maintenance_records for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = maintenance_records.vehicle_id
        and v.owner_id = (select auth.uid())
    )
  );

create policy "Mechanic manages maintenance through own workshops"
  on public.maintenance_records for all
  to authenticated
  using (
    exists (
      select 1 from public.workshops w
      where w.id = maintenance_records.workshop_id
        and w.mechanic_id = (select auth.uid())
        and w.deleted_at is null
    )
  )
  with check (
    exists (
      select 1 from public.workshops w
      where w.id = maintenance_records.workshop_id
        and w.mechanic_id = (select auth.uid())
        and w.deleted_at is null
    )
  );

-- Trigger: validate mechanic must use owned workshop + active vehicle link
create or replace function public.validate_maintenance_workshop()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  workshop_owner uuid;
  link_active boolean;
begin
  select role into v_role from public.profiles where id = (select auth.uid());

  if v_role = 'mechanic' then
    if new.workshop_id is null then
      raise exception 'Mechanic must select a workshop.';
    end if;

    select mechanic_id into workshop_owner from public.workshops where id = new.workshop_id;
    if workshop_owner != (select auth.uid()) then
      raise exception 'Workshop does not belong to you.';
    end if;

    select active into link_active from public.vehicle_workshops
    where vehicle_id = new.vehicle_id and workshop_id = new.workshop_id;
    if coalesce(link_active, false) = false then
      raise exception 'Vehicle is not actively linked to this workshop.';
    end if;
  end if;

  return new;
end;
$$;

create trigger maintenance_validate_workshop
  before insert or update on public.maintenance_records
  for each row execute procedure public.validate_maintenance_workshop();

create trigger maintenance_records_set_updated_at
  before update on public.maintenance_records
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- 8. Operating expenses
-- =========================================================================

create table public.operating_expenses (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     uuid not null references public.vehicles(id) on delete cascade,
  creator_id     uuid not null references public.profiles(id) on delete cascade,
  type           public.operating_expense_type not null,
  amount         numeric(12,2) not null check (amount > 0),
  date           date not null,
  notes          varchar(1000),

  -- Fuel-specific
  fuel_quantity  numeric(10,2) check (fuel_quantity is null or fuel_quantity >= 0),
  fuel_unit      varchar(10),
  fuel_station   varchar(120),
  fuel_address   varchar(255),

  -- Insurance / Registration
  due_date       date,
  term_months    int check (term_months is null or term_months in (3, 6, 12)),

  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Mutual exclusion: due_date XOR term_months for insurance/registration
  constraint expenses_due_xor_term check (
    type in ('fuel', 'insurance', 'registration')
    and (
      (type = 'fuel')
      or (due_date is not null and term_months is null)
      or (due_date is null and term_months is not null)
    )
  )
);

create index operating_expenses_vehicle_id_idx on public.operating_expenses (vehicle_id);
create index operating_expenses_creator_id_idx on public.operating_expenses (creator_id);
create index operating_expenses_type_idx       on public.operating_expenses (type);
create index operating_expenses_due_date_idx   on public.operating_expenses (due_date);
create index operating_expenses_date_idx       on public.operating_expenses (date);

alter table public.operating_expenses enable row level security;

create policy "Owner manages own operating expenses"
  on public.operating_expenses for all
  to authenticated
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);

create policy "Mechanic reads expenses for linked vehicles"
  on public.operating_expenses for select
  to authenticated
  using (
    exists (
      select 1 from public.vehicle_workshops vw
      join public.workshops w on w.id = vw.workshop_id
      where vw.vehicle_id = operating_expenses.vehicle_id
        and vw.active = true
        and w.mechanic_id = (select auth.uid())
        and w.deleted_at is null
    )
  );

create trigger operating_expenses_set_updated_at
  before update on public.operating_expenses
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- 9. Alerts
-- =========================================================================

create table public.alerts (
  id               uuid primary key default gen_random_uuid(),
  recipient_id     uuid not null references public.profiles(id) on delete cascade,
  vehicle_id       uuid not null references public.vehicles(id) on delete cascade,
  source_record_id uuid,
  source_type      varchar(40),
  kind             public.alert_kind not null,
  channel          public.alert_channel not null default 'in_app',
  status           public.alert_status not null default 'pending',
  title            varchar(200) not null,
  message          varchar(1000) not null,
  due_date         date,
  due_mileage      int,
  service_type     varchar(40),
  sent_at          timestamptz,
  read_at          timestamptz,
  error_detail     varchar(500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Deduplication: one alert per source record + recipient + channel
  constraint alerts_dedup unique (source_record_id, recipient_id, channel)
);

create index alerts_recipient_id_idx     on public.alerts (recipient_id);
create index alerts_vehicle_id_idx       on public.alerts (vehicle_id);
create index alerts_source_record_id_idx on public.alerts (source_record_id);
create index alerts_kind_idx             on public.alerts (kind);
create index alerts_status_idx           on public.alerts (status);
create index alerts_due_date_idx         on public.alerts (due_date);

alter table public.alerts enable row level security;

create policy "Recipient manages own alerts"
  on public.alerts for all
  to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

create trigger alerts_set_updated_at
  before update on public.alerts
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- 10. Mileage guard trigger — mileage cannot decrease
-- =========================================================================

create or replace function public.guard_mileage_no_decrease()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_mileage int;
begin
  select current_mileage into latest_mileage
  from public.vehicles where id = new.vehicle_id;

  if new.mileage < coalesce(latest_mileage, 0) then
    raise exception 'Mileage cannot be lower than the current vehicle mileage (%)', latest_mileage;
  end if;

  return new;
end;
$$;

create trigger mileage_logs_guard_no_decrease
  before insert on public.mileage_logs
  for each row execute procedure public.guard_mileage_no_decrease();

-- =========================================================================
-- 11. Update vehicle current_mileage after new log
-- =========================================================================

create or replace function public.update_vehicle_mileage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.vehicles
  set current_mileage = new.mileage,
      updated_at = now()
  where id = new.vehicle_id
    and current_mileage < new.mileage;

  return new;
end;
$$;

create trigger mileage_logs_update_vehicle_mileage
  after insert on public.mileage_logs
  for each row execute procedure public.update_vehicle_mileage();
