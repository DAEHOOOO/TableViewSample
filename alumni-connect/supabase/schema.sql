-- Enable PostGIS extension for geospatial queries
create extension if not exists postgis;

-- Create custom types
create type affiliation_type as enum (
  'elementary',
  'middle', 
  'high',
  'univ',
  'grad',
  'company'
);

create type message_status as enum (
  'sent',
  'delivered',
  'read'
);

-- Users table (age 19+ only)
create table app_user (
  user_id uuid primary key default gen_random_uuid(),
  nickname text not null,
  birth_year int not null check (birth_year <= extract(year from now()) - 19),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true,
  last_seen_at timestamptz default now()
);

-- User affiliations (schools and companies)
create table affiliation (
  affil_id bigserial primary key,
  user_id uuid references app_user(user_id) on delete cascade,
  type affiliation_type not null,
  name text not null,
  start_year int,
  end_year int,
  department text, -- for universities/companies
  major text, -- for universities
  created_at timestamptz default now()
);

-- User locations with geospatial data
create table user_location (
  user_id uuid primary key references app_user(user_id) on delete cascade,
  coord geography(Point, 4326) not null,
  updated_at timestamptz default now(),
  -- Store grid reference for privacy (optional)
  grid_id text
);

-- Chat rooms for 1:1 conversations
create table chat_room (
  room_id uuid primary key default gen_random_uuid(),
  user_a uuid references app_user(user_id) on delete cascade,
  user_b uuid references app_user(user_id) on delete cascade,
  created_at timestamptz default now(),
  last_message_at timestamptz default now(),
  unique(user_a, user_b)
);

-- Messages within chat rooms
create table message (
  msg_id bigserial primary key,
  room_id uuid references chat_room(room_id) on delete cascade,
  sender_id uuid references app_user(user_id) on delete cascade,
  body text not null,
  sent_at timestamptz default now(),
  status message_status default 'sent',
  -- For idempotency
  client_id text unique
);

-- User blocking functionality
create table user_block (
  blocker_id uuid references app_user(user_id) on delete cascade,
  blocked_id uuid references app_user(user_id) on delete cascade,
  created_at timestamptz default now(),
  primary key(blocker_id, blocked_id)
);

-- User reporting for moderation
create table user_report (
  report_id bigserial primary key,
  reporter_id uuid references app_user(user_id) on delete cascade,
  target_id uuid references app_user(user_id) on delete cascade,
  reason text not null,
  details text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Event tracking for analytics
create table user_event (
  event_id bigserial primary key,
  user_id uuid references app_user(user_id) on delete cascade,
  event_name text not null,
  event_data jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_user_location_coord on user_location using gist(coord);
create index idx_affiliation_user_type on affiliation(user_id, type);
create index idx_affiliation_name_type on affiliation(name, type);
create index idx_message_room_sent on message(room_id, sent_at desc);
create index idx_chat_room_users on chat_room(user_a, user_b);
create index idx_user_event_user_time on user_event(user_id, created_at desc);

-- RLS (Row Level Security) policies
alter table app_user enable row level security;
alter table affiliation enable row level security;
alter table user_location enable row level security;
alter table chat_room enable row level security;
alter table message enable row level security;
alter table user_block enable row level security;
alter table user_report enable row level security;
alter table user_event enable row level security;

-- Policies for app_user
create policy "Users can view their own profile" on app_user
  for select using (auth.uid()::text = user_id::text);

create policy "Users can update their own profile" on app_user
  for update using (auth.uid()::text = user_id::text);

-- Policies for affiliation
create policy "Users can view their own affiliations" on affiliation
  for select using (auth.uid()::text = user_id::text);

create policy "Users can insert their own affiliations" on affiliation
  for insert with check (auth.uid()::text = user_id::text);

create policy "Users can update their own affiliations" on affiliation
  for update using (auth.uid()::text = user_id::text);

create policy "Users can delete their own affiliations" on affiliation
  for delete using (auth.uid()::text = user_id::text);

-- Policies for user_location
create policy "Users can view their own location" on user_location
  for select using (auth.uid()::text = user_id::text);

create policy "Users can update their own location" on user_location
  for all using (auth.uid()::text = user_id::text);

-- Policies for chat_room
create policy "Users can view their own chat rooms" on chat_room
  for select using (
    auth.uid()::text = user_a::text or auth.uid()::text = user_b::text
  );

create policy "Users can create chat rooms" on chat_room
  for insert with check (
    auth.uid()::text = user_a::text or auth.uid()::text = user_b::text
  );

-- Policies for message
create policy "Users can view messages in their rooms" on message
  for select using (
    exists (
      select 1 from chat_room 
      where chat_room.room_id = message.room_id 
      and (auth.uid()::text = user_a::text or auth.uid()::text = user_b::text)
    )
  );

create policy "Users can send messages to their rooms" on message
  for insert with check (
    auth.uid()::text = sender_id::text and
    exists (
      select 1 from chat_room 
      where chat_room.room_id = message.room_id 
      and (auth.uid()::text = user_a::text or auth.uid()::text = user_b::text)
    )
  );

-- Policies for user_block
create policy "Users can view their own blocks" on user_block
  for select using (auth.uid()::text = blocker_id::text);

create policy "Users can create blocks" on user_block
  for insert with check (auth.uid()::text = blocker_id::text);

create policy "Users can delete their own blocks" on user_block
  for delete using (auth.uid()::text = blocker_id::text);

-- Policies for user_report
create policy "Users can create reports" on user_report
  for insert with check (auth.uid()::text = reporter_id::text);

-- Policies for user_event
create policy "Users can insert their own events" on user_event
  for insert with check (auth.uid()::text = user_id::text);

-- Function to find candidates within 6km radius with common affiliations
create or replace function find_candidates(
  target_user_id uuid,
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision default 6000
)
returns table(
  candidate_id uuid,
  nickname text,
  distance_meters double precision,
  common_affiliations text[]
)
language sql stable
security definer
as $$
  with user_point as (
    select st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography as geom
  ),
  nearby_users as (
    select 
      ul.user_id,
      au.nickname,
      st_distance(ul.coord, up.geom) as distance
    from user_location ul
    join app_user au on au.user_id = ul.user_id
    cross join user_point up
    where ul.user_id != target_user_id
      and au.is_active = true
      and st_dwithin(ul.coord, up.geom, radius_meters)
      -- Exclude blocked users
      and not exists (
        select 1 from user_block ub 
        where (ub.blocker_id = target_user_id and ub.blocked_id = ul.user_id)
           or (ub.blocker_id = ul.user_id and ub.blocked_id = target_user_id)
      )
  ),
  user_affiliations as (
    select array_agg(distinct a.name || ' (' || a.type || ')') as user_affils
    from affiliation a
    where a.user_id = target_user_id
  ),
  common_affils as (
    select 
      nu.user_id,
      nu.nickname,
      nu.distance,
      array_agg(distinct a1.name || ' (' || a1.type || ')') filter (
        where exists (
          select 1 from affiliation a2 
          where a2.user_id = target_user_id 
            and a2.name = a1.name 
            and a2.type = a1.type
        )
      ) as common_tags
    from nearby_users nu
    left join affiliation a1 on a1.user_id = nu.user_id
    group by nu.user_id, nu.nickname, nu.distance
  )
  select 
    ca.user_id,
    ca.nickname,
    ca.distance,
    coalesce(ca.common_tags, '{}')
  from common_affils ca
  where array_length(ca.common_tags, 1) > 0  -- Only users with common affiliations
  order by array_length(ca.common_tags, 1) desc, ca.distance asc
  limit 20;
$$;

-- Function to create or get existing chat room
create or replace function get_or_create_chat_room(
  user_a_id uuid,
  user_b_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  room_id uuid;
begin
  -- Check if room already exists (either direction)
  select cr.room_id into room_id
  from chat_room cr
  where (cr.user_a = user_a_id and cr.user_b = user_b_id)
     or (cr.user_a = user_b_id and cr.user_b = user_a_id);
  
  if room_id is null then
    -- Create new room
    insert into chat_room (user_a, user_b)
    values (user_a_id, user_b_id)
    returning chat_room.room_id into room_id;
  end if;
  
  return room_id;
end;
$$;

-- Trigger to update last_message_at in chat_room
create or replace function update_chat_room_last_message()
returns trigger
language plpgsql
as $$
begin
  update chat_room 
  set last_message_at = NEW.sent_at
  where room_id = NEW.room_id;
  return NEW;
end;
$$;

create trigger trigger_update_chat_room_last_message
  after insert on message
  for each row
  execute function update_chat_room_last_message();

-- Trigger to update user updated_at
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger trigger_app_user_updated_at
  before update on app_user
  for each row
  execute function update_updated_at_column();