alter table questions
  add column if not exists answer_context text,
  add column if not exists answer_media_url text;
