alter table public.alerts add column if not exists service_type varchar(40);

comment on column public.alerts.service_type is 'Tipo de servicio de mantenimiento (oil_change, brake_change, etc.).';
