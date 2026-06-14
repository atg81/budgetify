-- 001_init_schema.sql
-- Supabase-first schema for Budgetify
-- Tables: profiles, categories, transactions, budgets (optional), attachments (optional)
-- RLS policies and triggers to create profiles + default categories on sign-up

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------
-- Profiles
-- ---------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  timezone text,
  created_at timestamptz DEFAULT now()
);

-- ---------------------
-- Categories
-- ---------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  emoji text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ---------------------
-- Transactions
-- ---------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TRY',
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  date date NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);

-- ---------------------
-- Budgets (optional)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id),
  period text NOT NULL,
  limit_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ---------------------
-- Attachments (optional)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

-- ---------------------
-- Row Level Security
-- ---------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid()::uuid);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid()::uuid) WITH CHECK (id = auth.uid()::uuid);

-- Policies for categories (per-user)
CREATE POLICY "categories_select_owner" ON public.categories FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "categories_insert_owner" ON public.categories FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "categories_update_owner" ON public.categories FOR UPDATE USING (user_id = auth.uid()::uuid) WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "categories_delete_owner" ON public.categories FOR DELETE USING (user_id = auth.uid()::uuid);

-- Policies for transactions
CREATE POLICY "transactions_select_owner" ON public.transactions FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "transactions_insert_owner" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "transactions_update_owner" ON public.transactions FOR UPDATE USING (user_id = auth.uid()::uuid) WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "transactions_delete_owner" ON public.transactions FOR DELETE USING (user_id = auth.uid()::uuid);

-- Policies for budgets
CREATE POLICY "budgets_select_owner" ON public.budgets FOR SELECT USING (user_id = auth.uid()::uuid);
CREATE POLICY "budgets_insert_owner" ON public.budgets FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "budgets_update_owner" ON public.budgets FOR UPDATE USING (user_id = auth.uid()::uuid) WITH CHECK (user_id = auth.uid()::uuid);
CREATE POLICY "budgets_delete_owner" ON public.budgets FOR DELETE USING (user_id = auth.uid()::uuid);

-- Policies for attachments
CREATE POLICY "attachments_select_owner" ON public.attachments FOR SELECT USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()::uuid));
CREATE POLICY "attachments_insert_owner" ON public.attachments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()::uuid));
CREATE POLICY "attachments_delete_owner" ON public.attachments FOR DELETE USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()::uuid));

-- ---------------------
-- Triggers: create profile + default categories on new auth user
-- ---------------------
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  -- create basic profile
  INSERT INTO public.profiles (id, full_name, created_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', now())
  ON CONFLICT DO NOTHING;

  -- insert a small set of default categories for the new user
  INSERT INTO public.categories (user_id, name, color, emoji, is_default)
  VALUES
    (NEW.id, 'Kira & Konut', '#FB923C', '🏠', true),
    (NEW.id, 'Yiyecek & Market', '#F97316', '🍔', true),
    (NEW.id, 'Ulaşım', '#60A5FA', '🚌', true),
    (NEW.id, 'Eğlence', '#A78BFA', '🎮', true),
    (NEW.id, 'Diğer', '#9CA3AF', '🧾', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluşturma not: Supabase Dashboard > Auth > Templates > "Manage user metadata"
-- aracılığıyla automatic trigger'ı etkinleştir veya bunu manuel çalıştır:
-- (trigger için Supabase admin paneli gerekli, bu satırları skip edebilirsin)

-- End of migration
