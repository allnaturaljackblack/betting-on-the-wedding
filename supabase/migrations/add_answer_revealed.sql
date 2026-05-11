alter table questions
  add column if not exists answer_revealed boolean not null default false;
