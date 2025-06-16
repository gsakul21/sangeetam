create table if not exists public.user_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  spotify_access_token text,
  spotify_refresh_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS
alter table public.user_tokens enable row level security;

-- Create policies
create policy "Users can view their own tokens"
  on public.user_tokens for select
  using (auth.uid() = user_id);

create policy "Users can update their own tokens"
  on public.user_tokens for update
  using (auth.uid() = user_id);

create policy "Users can insert their own tokens"
  on public.user_tokens for insert
  with check (auth.uid() = user_id);

-- Create function to automatically update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_updated_at
  before update on public.user_tokens
  for each row
  execute function public.handle_updated_at(); 