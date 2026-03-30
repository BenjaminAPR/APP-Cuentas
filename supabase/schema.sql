-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run.
-- Hogar compartido: ingresos, gastos, cuentas, arriendo, diezmo, ofrenda de ayuno, deudas y trazabilidad.

-- ---------------------------------------------------------------------------
-- Perfiles (1 fila por usuario de auth)
-- ---------------------------------------------------------------------------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nuestro hogar',
  join_code text not null unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete set null,
  display_name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Datos del hogar
-- ---------------------------------------------------------------------------
create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  income_date date not null default (current_date),
  source text not null,
  notes text,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  expense_date date not null default (current_date),
  category text not null,
  notes text,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  account_type text not null default 'corriente',
  institution text,
  notes text,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Diezmo y ofrenda de ayuno (Iglesia de Jesucristo)
create table public.church_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  payment_type text not null check (payment_type in ('diezmo', 'ayuno')),
  amount numeric(14, 2) not null check (amount >= 0),
  payment_date date not null default (current_date),
  notes text,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  debt_type text not null check (debt_type in ('tarjeta', 'otro')),
  total_amount numeric(14, 2),
  balance_remaining numeric(14, 2) not null default 0 check (balance_remaining >= 0),
  installment_amount numeric(14, 2),
  installments_total integer,
  installments_paid integer not null default 0,
  due_day integer check (due_day is null or (due_day >= 1 and due_day <= 31)),
  creditor text,
  notes text,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  debt_id uuid not null references public.debts (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  payment_date date not null default (current_date),
  installments_covered integer not null default 1 check (installments_covered >= 0),
  notes text,
  created_by uuid not null references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Registro de cambios (auditoría)
create table public.audit_log (
  id bigint generated always as identity primary key,
  household_id uuid references public.households (id) on delete set null,
  user_id uuid references auth.users (id),
  table_name text not null,
  record_id uuid,
  action text not null,
  row_data jsonb,
  created_at timestamptz not null default now()
);

-- Índices
create index idx_incomes_household_date on public.incomes (household_id, income_date desc);
create index idx_expenses_household_date on public.expenses (household_id, expense_date desc);
create index idx_church_household_date on public.church_payments (household_id, payment_date desc);
create index idx_debts_household on public.debts (household_id);
create index idx_audit_household on public.audit_log (household_id, created_at desc);

-- updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['incomes', 'expenses', 'accounts', 'church_payments', 'debts', 'debt_payments']
  loop
    execute format('
      drop trigger if exists trg_%1$s_updated on public.%1$s;
      create trigger trg_%1$s_updated before update on public.%1$s
      for each row execute procedure public.set_updated_at();
    ', t);
  end loop;
end;
$$;

-- Auditoría: cada alta / baja / cambio en tablas clave
create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  rid uuid;
  payload jsonb;
  op text;
begin
  op := lower(tg_op);
  if tg_op = 'DELETE' then
    hid := old.household_id;
    rid := old.id;
    payload := to_jsonb(old);
    insert into public.audit_log (household_id, user_id, table_name, record_id, action, row_data)
    values (hid, auth.uid(), TG_TABLE_NAME::text, rid, op, payload);
    return old;
  else
    hid := new.household_id;
    rid := new.id;
    payload := to_jsonb(new);
    insert into public.audit_log (household_id, user_id, table_name, record_id, action, row_data)
    values (hid, auth.uid(), TG_TABLE_NAME::text, rid, op, payload);
    return new;
  end if;
end;
$$;

create trigger trg_incomes_audit after insert or update or delete on public.incomes
  for each row execute procedure public.audit_row();
create trigger trg_expenses_audit after insert or update or delete on public.expenses
  for each row execute procedure public.audit_row();
create trigger trg_accounts_audit after insert or update or delete on public.accounts
  for each row execute procedure public.audit_row();
create trigger trg_church_audit after insert or update or delete on public.church_payments
  for each row execute procedure public.audit_row();
create trigger trg_debts_audit after insert or update or delete on public.debts
  for each row execute procedure public.audit_row();
create trigger trg_debt_payments_audit after insert or update or delete on public.debt_payments
  for each row execute procedure public.audit_row();

-- RPC: hogar nuevo / unirse
create or replace function public.create_household(house_name text default 'Nuestro hogar')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  if (select household_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Ya perteneces a un hogar';
  end if;
  insert into public.households (name) values (house_name) returning id into hid;
  update public.profiles set household_id = hid where id = auth.uid();
  return hid;
end;
$$;

create or replace function public.join_household(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  if (select household_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Ya perteneces a un hogar';
  end if;
  select id into hid from public.households where upper(trim(join_code)) = upper(trim(code));
  if hid is null then
    raise exception 'Código de hogar no válido';
  end if;
  update public.profiles set household_id = hid where id = auth.uid();
  return hid;
end;
$$;

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;

-- Helper RLS
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid()
$$;

-- RLS
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.incomes enable row level security;
alter table public.expenses enable row level security;
alter table public.accounts enable row level security;
alter table public.church_payments enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.audit_log enable row level security;

-- INSERT en households solo vía create_household (SECURITY DEFINER, sin política de INSERT).
create policy households_select on public.households
  for select using (id = public.current_household_id());

create policy households_update on public.households
  for update using (id = public.current_household_id());

create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or household_id = public.current_household_id()
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- Tablas de datos: mismo hogar
create policy incomes_all on public.incomes
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy expenses_all on public.expenses
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy accounts_all on public.accounts
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy church_all on public.church_payments
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy debts_all on public.debts
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy debt_payments_all on public.debt_payments
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

create policy audit_select on public.audit_log
  for select using (household_id = public.current_household_id());
