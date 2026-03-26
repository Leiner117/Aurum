-- ============================================================
-- Default categories seed — runs AFTER a user is created
-- This is called from the application on first login
-- ============================================================

-- Function to seed default categories for a new user
create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.categories (user_id, name, icon, color, is_default) values
    (p_user_id, 'Food & Dining',    'utensils',     '#f97316', true),
    (p_user_id, 'Transportation',   'car',           '#3b82f6', true),
    (p_user_id, 'Housing',          'home',          '#8b5cf6', true),
    (p_user_id, 'Healthcare',       'heart-pulse',   '#ef4444', true),
    (p_user_id, 'Entertainment',    'tv',            '#ec4899', true),
    (p_user_id, 'Shopping',         'shopping-bag',  '#f59e0b', true),
    (p_user_id, 'Education',        'book-open',     '#10b981', true),
    (p_user_id, 'Travel',           'plane',         '#06b6d4', true),
    (p_user_id, 'Savings',          'piggy-bank',    '#22c55e', true),
    (p_user_id, 'Other',            'ellipsis',      '#64748b', true)
  on conflict do nothing;
end;
$$;
