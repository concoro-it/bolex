create table if not exists public.source_references (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_id uuid references public.projects(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  document_version_id uuid references public.document_versions(id) on delete set null,
  source_type text not null check (source_type in (
    'legislation',
    'case_law',
    'user_document',
    'administrative_decision',
    'tax_ruling',
    'ai_inference'
  )),
  provider text not null,
  tool_name text,
  title text,
  institution text,
  court text,
  chamber text,
  decision_date text,
  case_no text,
  decision_no text,
  legislation_no text,
  article_no text,
  url text,
  quote text,
  raw_payload jsonb,
  verification_status text not null default 'partial' check (verification_status in (
    'verified',
    'partial',
    'not_found',
    'user_document',
    'ai_inference'
  )),
  created_at timestamptz not null default now()
);

create index if not exists source_references_user_idx
  on public.source_references(user_id, created_at desc);
create index if not exists source_references_project_idx
  on public.source_references(project_id, created_at desc);
create index if not exists source_references_chat_idx
  on public.source_references(chat_id, created_at desc);
create index if not exists source_references_document_idx
  on public.source_references(document_id, created_at desc);

create table if not exists public.verification_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_id uuid references public.projects(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  document_version_id uuid references public.document_versions(id) on delete set null,
  event_type text not null check (event_type in (
    'research_started',
    'mcp_tool_called',
    'source_attached',
    'draft_generated',
    'edit_suggested',
    'edit_accepted',
    'edit_rejected',
    'document_version_created'
  )),
  event_label text,
  tool_name text,
  tool_args_summary jsonb,
  source_reference_ids uuid[] not null default '{}',
  related_edit_id uuid references public.document_edits(id) on delete set null,
  status text not null default 'ok',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists verification_events_user_idx
  on public.verification_events(user_id, created_at desc);
create index if not exists verification_events_project_idx
  on public.verification_events(project_id, created_at desc);
create index if not exists verification_events_chat_idx
  on public.verification_events(chat_id, created_at desc);
create index if not exists verification_events_document_idx
  on public.verification_events(document_id, created_at desc);

create table if not exists public.document_placeholders (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_id uuid references public.document_versions(id) on delete cascade,
  field_key text not null,
  label text not null,
  value text,
  value_type text not null default 'text',
  source text not null default 'ai',
  required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_placeholders_document_idx
  on public.document_placeholders(document_id, version_id);

create table if not exists public.document_source_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  document_version_id uuid references public.document_versions(id) on delete cascade,
  source_reference_id uuid not null references public.source_references(id) on delete cascade,
  anchor_type text not null default 'quote' check (anchor_type in (
    'quote',
    'block',
    'range'
  )),
  anchor_text text,
  block_key text,
  from_pos integer,
  to_pos integer,
  created_at timestamptz not null default now()
);

create index if not exists document_source_links_document_idx
  on public.document_source_links(document_id, document_version_id);
create index if not exists document_source_links_source_idx
  on public.document_source_links(source_reference_id);
