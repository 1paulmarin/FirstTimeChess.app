-- Create game rooms table
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  teacher_name text not null,
  invite_code text not null unique,
  unique_link text,
  max_participants integer default 10,
  selected_player_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.game_rooms enable row level security;

-- Create policies for game rooms
create policy "rooms_select_all"
  on public.game_rooms for select
  using (true); -- Anyone can view rooms to join them

create policy "rooms_insert_teacher"
  on public.game_rooms for insert
  with check (auth.uid() = teacher_id);

create policy "rooms_update_teacher"
  on public.game_rooms for update
  using (auth.uid() = teacher_id);

create policy "rooms_delete_teacher"
  on public.game_rooms for delete
  using (auth.uid() = teacher_id);

-- Create room participants table
create table if not exists public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

-- Enable RLS
alter table public.room_participants enable row level security;

-- Create policies for room participants
create policy "participants_select_all"
  on public.room_participants for select
  using (true);

create policy "participants_insert_own"
  on public.room_participants for insert
  with check (auth.uid() = user_id);

create policy "participants_delete_own"
  on public.room_participants for delete
  using (auth.uid() = user_id);
