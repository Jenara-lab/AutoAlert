create table public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid references public.alerts(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete cascade,
  channel public.alert_channel not null,
  status text not null default 'pending',
  error_message text,
  external_message_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.alert_deliveries enable row level security;

create policy "alert_deliveries readable by owner"
  on public.alert_deliveries for select
  to authenticated
  using (profile_id = auth.uid());

comment on table public.alert_deliveries is 'Registro de intentos de entrega de alertas por canal externo.';
