-- FarmHelper relational schema. Every farm-owned table carries farm_id; row-level security isolates farms
-- and restricts writes by the member's role. The browser app currently stores data locally; this schema is the
-- server-side target for sync (see src/lib/sync.ts).

create type public.farm_role as enum ('owner','farm_manager','veterinarian','agronomist','employee','accountant','viewer');

create table public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null, location text, latitude numeric, longitude numeric, size_ha numeric,
  agri_ha numeric, pasture_ha numeric, farm_type text, manager text, phone text, email text,
  registration text, description text, created_by uuid references auth.users(id) default auth.uid(), created_at timestamptz default now()
);
create table public.farm_members (
  farm_id uuid references public.farms(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade,
  role public.farm_role not null default 'viewer', primary key (farm_id, user_id)
);
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, phone text);

create or replace function public.farm_role_of(f uuid) returns public.farm_role language sql stable security definer set search_path = public as
$$ select role from public.farm_members where farm_id = f and user_id = auth.uid() $$;
create or replace function public.can_write(f uuid, area text) returns boolean language sql stable security definer set search_path = public as
$$ select case public.farm_role_of(f)
  when 'owner' then true when 'farm_manager' then area <> 'settings'
  when 'veterinarian' then area in ('livestock','documents') when 'agronomist' then area in ('agriculture','inventory','documents')
  when 'employee' then area in ('livestock','agriculture','tasks') when 'accountant' then area in ('finance','documents')
  else false end $$;

-- core tables --------------------------------------------------------------
create table public.farm_locations (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, type text not null, name text not null, latitude numeric, longitude numeric, notes text);
create table public.suppliers (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, name text not null, phone text, email text, address text, notes text);
create table public.customers (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, name text not null, phone text, email text, address text, notes text);

create table public.fields (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, name text not null, latitude numeric, longitude numeric, size_ha numeric, soil_type text, soil_fertility text, current_crop text, previous_crop text, irrigation_system text, status text default 'Active');
create table public.crops (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid references public.fields(id), crop_name text not null, variety text, planting_date date, expected_harvest_date date, actual_harvest_date date, area_ha numeric, seed_qty numeric, seed_cost numeric, expected_yield numeric, actual_yield numeric, production_cost numeric, selling_price numeric, health text);
create table public.crop_cycles (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, crop_id uuid references public.crops(id) on delete cascade, name text, start_date date, end_date date);
create table public.planting_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid references public.fields(id), crop_name text, variety text, planting_date date, expected_harvest_date date, quantity numeric, cost numeric, status text);
create table public.harvest_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, crop_id uuid references public.crops(id), harvest_date date, quantity numeric, quality text, storage text, quantity_sold numeric, selling_price numeric);
create table public.irrigation_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid references public.fields(id), crop_id uuid references public.crops(id), date date, system text, duration_h numeric, water_m3 numeric, source text, cost numeric, problems text);
create table public.fertilizer_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid references public.fields(id), crop_id uuid references public.crops(id), fertilizer_type text, quantity numeric, application_date date, method text, cost numeric);
create table public.crop_protection_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid references public.fields(id), crop_id uuid references public.crops(id), kind text, product text, application_date date, quantity numeric, target text, cost numeric);
create table public.crop_diagnoses (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, crop_id uuid references public.crops(id) on delete cascade, date date, finding text, confidence text, source text, symptoms text, next_steps text);

create table public.breeds (id uuid primary key default gen_random_uuid(), farm_id uuid references public.farms(id) on delete cascade, species text not null, name text not null);
create table public.herds (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, name text not null);
create table public.pastures (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, code text, name text not null, area_ha numeric, latitude numeric, longitude numeric, forage text, capacity numeric, grazing_start date, grazing_end date, rest_days numeric, last_fertilizer date, water text, condition text, notes text);
create table public.animals (
  id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade,
  tag text not null, rfid text, name text, species text default 'Cattle', breed_id uuid references public.breeds(id), breed text, category text, sex text, dob date, color text, registration_no text,
  sire_id uuid references public.animals(id), dam_id uuid references public.animals(id), herd_id uuid references public.herds(id), herd text, pasture_id uuid references public.pastures(id), location text,
  purchase_date date, purchase_price numeric, acquisition_cost numeric, estimated_value numeric, current_weight numeric, breeding_animal boolean default false,
  status text not null default 'Active' check (status in ('Active','Sold','Deceased','Missing','Quarantined','Transferred')), sold_date date, death_date date,
  unique (farm_id, tag)
);
create table public.weight_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id) on delete cascade, date date not null, weight numeric not null, previous_weight numeric, difference numeric, adg numeric, location text, notes text);
create table public.grazing_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id) on delete cascade, pasture_id uuid not null references public.pastures(id), start_date date, end_date date);
create table public.health_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id) on delete cascade, date date, condition text, symptoms text, diagnosis text, treatment text, medication text, dosage text, veterinarian text, start_date date, end_date date, withdrawal_days int, recovery text, source text, urgency text, notes text);
create table public.treatments (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, health_record_id uuid references public.health_records(id) on delete cascade, animal_id uuid references public.animals(id) on delete cascade, medication text, dosage text, start_date date, end_date date, cost numeric);
create table public.veterinary_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid references public.animals(id), date date, veterinarian text, reason text, status text, notes text);
create table public.vaccination_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id) on delete cascade, vaccine text not null, date date, next_date date, batch text, veterinarian text, cost numeric);
create table public.disease_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id) on delete cascade, disease text, date_detected date, symptoms text, diagnosis text, treatment text, outcome text, isolation boolean);
create table public.quarantine_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id) on delete cascade, reason text, start_date date, expected_release date, health_status text, treatments text, vet_notes text, released boolean default false);
create table public.feed_inventory (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, feed_type text, name text not null, supplier_id uuid references public.suppliers(id), qty_purchased numeric, unit text, cost_per_unit numeric, purchase_date date, expiry_date date, storage text, min_stock numeric);
create table public.feed_consumption (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, feed_id uuid not null references public.feed_inventory(id) on delete cascade, date date, quantity numeric not null, target text, notes text);
create table public.feedlot_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, feedlot_id text not null, animal_id uuid not null references public.animals(id) on delete cascade, entry_date date, start_weight numeric, current_weight numeric, target_weight numeric, ration text, daily_intake_kg numeric, feed_cost_per_kg numeric, sale_price_per_kg numeric);
create table public.breeding_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, cow_id uuid not null references public.animals(id), bull_id uuid references public.animals(id), mating_date date, method text, semen text, pregnancy_status text, expected_calving_date date, actual_calving_date date, calf_id uuid references public.animals(id), birth_weight numeric, calf_sex text, complications text);
create table public.birth_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, calf_id uuid references public.animals(id), mother_id uuid references public.animals(id), father_id uuid references public.animals(id), birth_date date, birth_weight numeric, sex text, breed text, complications text, health_status text, weaning_date date, weaning_weight numeric);
create table public.mortality_records (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id), date date, cause text, location text, vet_findings text, loss numeric, notes text);
create table public.livestock_purchases (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid references public.animals(id), date date, seller text, price numeric, transport numeric, vet_cost numeric, other_cost numeric, weight numeric, location text, notes text);
create table public.livestock_sales (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, animal_id uuid not null references public.animals(id), customer_id uuid references public.customers(id), date date, buyer text, weight numeric, price numeric, transport numeric, commission numeric, other_cost numeric, cost_basis numeric, notes text);

create table public.employees (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, user_id uuid references auth.users(id), emp_no text, name text not null, position text, department text, phone text, email text, hire_date date, salary numeric, pay_frequency text, work_location text, emergency_contact text, status text default 'Active');
create table public.attendance (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, employee_id uuid not null references public.employees(id) on delete cascade, date date, status text, hours numeric, notes text);
create table public.tasks (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, employee_id uuid references public.employees(id), name text not null, description text, section text, priority text, start_date date, due_date date, status text default 'To do', notes text);
create table public.income (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, customer_id uuid references public.customers(id), date date not null, category text, description text, amount numeric not null, payment_method text, payment_status text default 'Paid', due_date date, section text, animal_id uuid references public.animals(id), crop_id uuid references public.crops(id), field_id uuid references public.fields(id), pasture_id uuid references public.pastures(id), herd text, feedlot_id text, cycle text, document_id uuid);
create table public.expenses (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, supplier_id uuid references public.suppliers(id), date date not null, category text, description text, amount numeric not null, payment_method text, payment_status text default 'Paid', due_date date, section text, animal_id uuid references public.animals(id), crop_id uuid references public.crops(id), field_id uuid references public.fields(id), pasture_id uuid references public.pastures(id), herd text, feedlot_id text, cycle text, document_id uuid);
create table public.budgets (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, category text, month text, amount numeric);
create table public.inventory (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, supplier_id uuid references public.suppliers(id), category text, name text not null, quantity numeric, unit text, price numeric, storage text, expiry date, min_stock numeric, next_service date);
create table public.documents (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, title text not null, category text, related_to text, expiry date, storage_path text, notes text, created_at timestamptz default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, user_id uuid references auth.users(id), kind text, title text, detail text, severity text, link text, read_at timestamptz, created_at timestamptz default now());
create table public.audit_logs (id bigint generated always as identity primary key, farm_id uuid references public.farms(id) on delete cascade, user_id uuid default auth.uid(), action text, table_name text, row_id uuid, changes jsonb, at timestamptz default now());

-- indexes for the common lookups
create index on public.animals (farm_id, status); create index on public.weight_records (animal_id, date);
create index on public.vaccination_records (farm_id, next_date); create index on public.expenses (farm_id, date); create index on public.income (farm_id, date);

-- row-level security: members read their farm; writes depend on role ----------
alter table public.farms enable row level security; alter table public.farm_members enable row level security; alter table public.profiles enable row level security;
create policy farms_read on public.farms for select using (public.farm_role_of(id) is not null);
create policy farms_insert on public.farms for insert with check (auth.uid() = created_by);
create policy farms_update on public.farms for update using (public.farm_role_of(id) = 'owner');
create policy members_read on public.farm_members for select using (public.farm_role_of(farm_id) is not null);
create policy members_owner on public.farm_members for all using (public.farm_role_of(farm_id) = 'owner') with check (public.farm_role_of(farm_id) = 'owner');
create policy profiles_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.area_of(t text) returns text language sql immutable as $$ select case
  when t in ('fields','crops','crop_cycles','planting_records','harvest_records','irrigation_records','fertilizer_records','crop_protection_records','crop_diagnoses') then 'agriculture'
  when t in ('breeds','herds','pastures','animals','weight_records','grazing_records','health_records','treatments','veterinary_records','vaccination_records','disease_records','quarantine_records','feed_inventory','feed_consumption','feedlot_records','breeding_records','birth_records','mortality_records','livestock_purchases','livestock_sales') then 'livestock'
  when t in ('income','expenses','budgets','customers') then 'finance' when t in ('inventory','suppliers') then 'inventory'
  when t in ('employees','attendance') then 'employees' when t = 'tasks' then 'tasks' when t = 'documents' then 'documents' else 'settings' end $$;

do $$ declare t text; begin
  foreach t in array array['farm_locations','suppliers','customers','fields','crops','crop_cycles','planting_records','harvest_records','irrigation_records','fertilizer_records','crop_protection_records','crop_diagnoses','herds','pastures','animals','weight_records','grazing_records','health_records','treatments','veterinary_records','vaccination_records','disease_records','quarantine_records','feed_inventory','feed_consumption','feedlot_records','breeding_records','birth_records','mortality_records','livestock_purchases','livestock_sales','employees','attendance','tasks','income','expenses','budgets','inventory','documents','notifications'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.farm_role_of(farm_id) is not null)', t||'_read', t);
    execute format('create policy %I on public.%I for all using (public.can_write(farm_id, public.area_of(%L))) with check (public.can_write(farm_id, public.area_of(%L)))', t||'_write', t, t, t);
  end loop;
end $$;
alter table public.breeds enable row level security;
create policy breeds_read on public.breeds for select using (farm_id is null or public.farm_role_of(farm_id) is not null);
create policy breeds_write on public.breeds for all using (farm_id is not null and public.can_write(farm_id,'livestock')) with check (farm_id is not null and public.can_write(farm_id,'livestock'));
alter table public.audit_logs enable row level security;
create policy audit_read on public.audit_logs for select using (public.farm_role_of(farm_id) in ('owner','farm_manager'));

-- audit trigger on the sensitive tables
create or replace function public.log_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (farm_id, action, table_name, row_id, changes)
  values (coalesce(new.farm_id, old.farm_id), tg_op, tg_table_name, coalesce(new.id, old.id), case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end);
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['animals','livestock_sales','livestock_purchases','income','expenses','employees','mortality_records'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.log_change()', t||'_audit', t);
  end loop;
end $$;
-- Backups: enable Point-in-Time Recovery / daily backups in the Supabase project settings.
