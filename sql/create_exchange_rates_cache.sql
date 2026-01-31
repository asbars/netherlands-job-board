-- ========================================
-- Exchange Rates Cache Table
-- Stores exchange rates with timestamps for 1-hour caching
-- ========================================

-- Create table for caching exchange rates
CREATE TABLE IF NOT EXISTS public.exchange_rates_cache (
  id SERIAL PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair
ON public.exchange_rates_cache(from_currency, to_currency);

-- Create index for cleanup of old rates
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched_at
ON public.exchange_rates_cache(fetched_at);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.exchange_rates_cache TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.exchange_rates_cache_id_seq TO anon, authenticated;

-- Function to get cached rate if less than 1 hour old
CREATE OR REPLACE FUNCTION public.get_cached_exchange_rate(
  p_from_currency TEXT,
  p_to_currency TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_rate NUMERIC;
  v_fetched_at TIMESTAMPTZ;
BEGIN
  -- Get rate and timestamp
  SELECT rate, fetched_at INTO v_rate, v_fetched_at
  FROM public.exchange_rates_cache
  WHERE from_currency = p_from_currency
    AND to_currency = p_to_currency;

  -- If not found or older than 1 hour, return NULL
  IF v_rate IS NULL OR v_fetched_at < NOW() - INTERVAL '1 hour' THEN
    RETURN NULL;
  END IF;

  RETURN v_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to save/update cached rate
CREATE OR REPLACE FUNCTION public.set_cached_exchange_rate(
  p_from_currency TEXT,
  p_to_currency TEXT,
  p_rate NUMERIC
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update rate with current timestamp
  INSERT INTO public.exchange_rates_cache (from_currency, to_currency, rate, fetched_at)
  VALUES (p_from_currency, p_to_currency, p_rate, NOW())
  ON CONFLICT (from_currency, to_currency)
  DO UPDATE SET
    rate = EXCLUDED.rate,
    fetched_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant access to functions
GRANT EXECUTE ON FUNCTION public.get_cached_exchange_rate(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_cached_exchange_rate(TEXT, TEXT, NUMERIC) TO anon, authenticated;

-- Function to clean up old rates (older than 7 days) - run periodically
CREATE OR REPLACE FUNCTION public.cleanup_old_exchange_rates()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.exchange_rates_cache
  WHERE fetched_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.cleanup_old_exchange_rates() TO anon, authenticated;

COMMENT ON TABLE public.exchange_rates_cache IS 'Caches exchange rates for 1 hour to reduce API calls';
COMMENT ON FUNCTION public.get_cached_exchange_rate IS 'Returns cached rate if less than 1 hour old, NULL otherwise';
COMMENT ON FUNCTION public.set_cached_exchange_rate IS 'Saves or updates exchange rate with current timestamp';
COMMENT ON FUNCTION public.cleanup_old_exchange_rates IS 'Removes rates older than 7 days - should be run periodically';
