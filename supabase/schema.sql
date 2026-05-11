-- Settings (singleton row, id always = 1)
create table if not exists settings (
  id int primary key default 1,
  scoring_mode text not null default 'traditional', -- 'traditional' | 'vegas'
  show_answers boolean not null default false,
  event_locked boolean not null default false,
  starting_chips int not null default 1000,
  admin_password text not null default 'wedding2026'
);
insert into settings (id) values (1) on conflict do nothing;

-- Questions
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'multiple_choice' | 'fill_blank' | 'over_under' | 'moneyline' | 'prop_bet'
  prompt text not null,
  options jsonb, -- array of strings for multiple_choice and moneyline
  correct_answer text,
  over_under_line numeric,
  odds jsonb, -- { "Option A": "+150", "Option B": "-180" } for vegas
  points int not null default 100,
  active boolean not null default true,
  order_index int not null default 0,
  answer_context text,
  answer_media_url text,
  answer_media_urls jsonb,
  answer_revealed boolean not null default false,
  created_at timestamptz default now()
);

-- Guests
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Bets/Answers
create table if not exists bets (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  answer text not null,
  chips_wagered int,
  created_at timestamptz default now(),
  unique(guest_id, question_id)
);

-- Enable realtime on leaderboard-relevant tables
alter publication supabase_realtime add table bets;
alter publication supabase_realtime add table settings;
alter publication supabase_realtime add table questions;
