-- Notificaciones push de DELVA. Correr UNA vez en el SQL editor de Supabase.
-- Los nombres llevan prefijo delva_ porque el proyecto de Supabase se comparte con Boga.
-- Sin políticas de RLS a propósito: solo el servidor (service role) lee y escribe estas tablas;
-- el navegador nunca las toca directo (una suscripción es un dato sensible).

create table if not exists public.delva_push_subs (
  endpoint    text primary key,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.delva_push_campanas (
  id          bigserial primary key,
  titulo      text not null,
  cuerpo      text not null,
  url         text,
  enviada_por text,
  enviados    int not null default 0,
  fallidos    int not null default 0,
  creada_at   timestamptz not null default now()
);

alter table public.delva_push_subs      enable row level security;
alter table public.delva_push_campanas  enable row level security;

create index if not exists delva_push_campanas_creada_idx on public.delva_push_campanas (creada_at desc);
