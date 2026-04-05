-- ============================================================
-- Fix account balance trigger to handle currency conversion
-- When expense currency differs from account currency,
-- convert using exchange_rates before adjusting balance.
-- ============================================================

create or replace function public.update_account_balance()
returns trigger
language plpgsql
security definer
as $$
declare
  v_account_currency text;
  v_rate             numeric := 1;
  v_delta            numeric;
begin
  -- Helper: resolve conversion rate from expense currency → account currency
  -- Tries direct rate first, then inverse; defaults to 1 if not found.

  if TG_OP = 'INSERT' then
    if NEW.account_id is not null then
      select currency into v_account_currency
        from public.accounts where id = NEW.account_id;

      if v_account_currency is distinct from NEW.currency then
        select rate into v_rate from public.exchange_rates
          where base_currency = NEW.currency
            and target_currency = v_account_currency
          limit 1;
        if v_rate is null then
          select (1.0 / rate) into v_rate from public.exchange_rates
            where base_currency = v_account_currency
              and target_currency = NEW.currency
            limit 1;
        end if;
        if v_rate is null then v_rate := 1; end if;
      end if;

      v_delta := NEW.amount * v_rate;
      update public.accounts
        set balance    = balance + (case when NEW.type = 'income' then v_delta else -v_delta end),
            updated_at = now()
        where id = NEW.account_id;
    end if;

  elsif TG_OP = 'DELETE' then
    if OLD.account_id is not null then
      select currency into v_account_currency
        from public.accounts where id = OLD.account_id;

      v_rate := 1;
      if v_account_currency is distinct from OLD.currency then
        select rate into v_rate from public.exchange_rates
          where base_currency = OLD.currency
            and target_currency = v_account_currency
          limit 1;
        if v_rate is null then
          select (1.0 / rate) into v_rate from public.exchange_rates
            where base_currency = v_account_currency
              and target_currency = OLD.currency
            limit 1;
        end if;
        if v_rate is null then v_rate := 1; end if;
      end if;

      v_delta := OLD.amount * v_rate;
      update public.accounts
        set balance    = balance + (case when OLD.type = 'income' then -v_delta else v_delta end),
            updated_at = now()
        where id = OLD.account_id;
    end if;

  elsif TG_OP = 'UPDATE' then
    -- Reverse old row
    if OLD.account_id is not null then
      select currency into v_account_currency
        from public.accounts where id = OLD.account_id;

      v_rate := 1;
      if v_account_currency is distinct from OLD.currency then
        select rate into v_rate from public.exchange_rates
          where base_currency = OLD.currency
            and target_currency = v_account_currency
          limit 1;
        if v_rate is null then
          select (1.0 / rate) into v_rate from public.exchange_rates
            where base_currency = v_account_currency
              and target_currency = OLD.currency
            limit 1;
        end if;
        if v_rate is null then v_rate := 1; end if;
      end if;

      v_delta := OLD.amount * v_rate;
      update public.accounts
        set balance = balance + (case when OLD.type = 'income' then -v_delta else v_delta end)
        where id = OLD.account_id;
    end if;

    -- Apply new row
    if NEW.account_id is not null then
      select currency into v_account_currency
        from public.accounts where id = NEW.account_id;

      v_rate := 1;
      if v_account_currency is distinct from NEW.currency then
        select rate into v_rate from public.exchange_rates
          where base_currency = NEW.currency
            and target_currency = v_account_currency
          limit 1;
        if v_rate is null then
          select (1.0 / rate) into v_rate from public.exchange_rates
            where base_currency = v_account_currency
              and target_currency = NEW.currency
            limit 1;
        end if;
        if v_rate is null then v_rate := 1; end if;
      end if;

      v_delta := NEW.amount * v_rate;
      update public.accounts
        set balance    = balance + (case when NEW.type = 'income' then v_delta else -v_delta end),
            updated_at = now()
        where id = NEW.account_id;
    end if;
  end if;

  return coalesce(NEW, OLD);
end;
$$;
