-- Santomi core schema, part 1: users, rooms, members, exclusions, draw assignments.
-- Identity: users.id is our own UUID; telegram_id is verified server-side (Edge Function
-- validates initData HMAC, then mints a Supabase JWT whose `sub` = users.id).

create table public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  first_name text not null,
  username text,
  avatar_url text,
  language_code text not null default 'ru',
  created_at timestamptz not null default now()
);

create type public.room_stage as enum ('gathering', 'drawn', 'finished');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.users(id),
  name text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 300),
  budget_min integer check (budget_min >= 0),
  budget_max integer check (budget_max >= budget_min),
  currency text not null default 'RUB',
  exchange_date date,
  max_members integer not null default 20 check (max_members between 3 and 500),
  anonymous_questions boolean not null default true,
  stage public.room_stage not null default 'gathering',
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index on public.room_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(12), 'hex'),
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.draw_exclusions (
  room_id uuid not null,
  giver_id uuid not null,
  receiver_id uuid not null,
  primary key (room_id, giver_id, receiver_id),
  foreign key (room_id, giver_id) references public.room_members(room_id, user_id) on delete cascade,
  foreign key (room_id, receiver_id) references public.room_members(room_id, user_id) on delete cascade,
  check (giver_id <> receiver_id)
);

-- Secret table: one row per giver, one per receiver, never self. Written only by the
-- draw Edge Function (service role) inside one transaction; clients cannot read it directly.
create table public.draw_assignments (
  room_id uuid not null,
  giver_id uuid not null,
  receiver_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (room_id, giver_id),
  unique (room_id, receiver_id),
  foreign key (room_id, giver_id) references public.room_members(room_id, user_id),
  foreign key (room_id, receiver_id) references public.room_members(room_id, user_id),
  check (giver_id <> receiver_id)
);

-- Atomic, idempotent draw storage. Locks the room row so concurrent draw requests serialize;
-- the second caller sees stage <> 'gathering' and is rejected. Callable by service role only.
create or replace function public.store_draw(
  p_room_id uuid, p_actor uuid, p_pairs jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare r public.rooms%rowtype; n int;
begin
  select * into r from public.rooms where id = p_room_id for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.organizer_id <> p_actor then raise exception 'forbidden'; end if;
  if r.stage <> 'gathering' then raise exception 'already_drawn'; end if;

  select count(*) into n from public.room_members where room_id = p_room_id;
  if n < 3 or jsonb_array_length(p_pairs) <> n then raise exception 'invalid_pairs'; end if;

  insert into public.draw_assignments (room_id, giver_id, receiver_id)
  select p_room_id, (e->>'giver')::uuid, (e->>'receiver')::uuid
  from jsonb_array_elements(p_pairs) e;

  update public.rooms set stage = 'drawn', drawn_at = now() where id = p_room_id;
end $$;
revoke all on function public.store_draw(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.store_draw(uuid, uuid, jsonb) to service_role;

-- Row Level Security
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.invitations enable row level security;
alter table public.draw_exclusions enable row level security;
alter table public.draw_assignments enable row level security;  -- no policies: deny all to clients

create or replace function public.is_room_member(p_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.room_members where room_id = p_room and user_id = auth.uid())
$$;

create policy users_self on public.users for select using (id = auth.uid());
create policy rooms_member_read on public.rooms for select using (public.is_room_member(id));
create policy members_read on public.room_members for select using (public.is_room_member(room_id));
-- Invitations, exclusions and joins go through Edge Functions (validation + limits).
-- Exclusions are organizer-only knowledge, so there is deliberately no client read policy.

-- Recipient lookup for the reveal screen: returns ONLY the caller's own assignment.
create or replace function public.my_recipient(p_room uuid)
returns table (receiver_id uuid, first_name text, avatar_url text)
language sql stable security definer set search_path = public as $$
  select u.id, u.first_name, u.avatar_url
  from public.draw_assignments a join public.users u on u.id = a.receiver_id
  where a.room_id = p_room and a.giver_id = auth.uid()
$$;
revoke all on function public.my_recipient(uuid) from public, anon;
grant execute on function public.my_recipient(uuid) to authenticated;
