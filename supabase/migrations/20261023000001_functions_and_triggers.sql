-- Migration: 20261023000001_functions_and_triggers.sql
-- Description: Trigger functions for updated_at, search vector, inquiry immutability,
-- status transitions, and atomic rate limit checker.

-- 1. Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_commission_offerings_updated_at
  BEFORE UPDATE ON public.commission_offerings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_artworks_updated_at
  BEFORE UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_commission_inquiries_updated_at
  BEFORE UPDATE ON public.commission_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_pending_uploads_updated_at
  BEFORE UPDATE ON public.pending_uploads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Artworks search_vector trigger function (Section 5.7.4)
CREATE OR REPLACE FUNCTION public.artworks_update_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'simple'::regconfig,
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    array_to_string(NEW.tags, ' ')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_artworks_search_vector
  BEFORE INSERT OR UPDATE OF title, description, tags ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.artworks_update_search_vector();

-- 3. Commission inquiry immutable fields guard (Section 5.4.3 MUST)
CREATE OR REPLACE FUNCTION public.inquiry_protect_immutable_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF (
    OLD.client_name IS DISTINCT FROM NEW.client_name OR
    OLD.client_email IS DISTINCT FROM NEW.client_email OR
    OLD.offering_id IS DISTINCT FROM NEW.offering_id OR
    OLD.offering_title_snapshot IS DISTINCT FROM NEW.offering_title_snapshot OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.budget_amount IS DISTINCT FROM NEW.budget_amount OR
    OLD.budget_currency IS DISTINCT FROM NEW.budget_currency OR
    OLD.desired_deadline IS DISTINCT FROM NEW.desired_deadline OR
    OLD.availability_at_submission IS DISTINCT FROM NEW.availability_at_submission OR
    OLD.submitted_at IS DISTINCT FROM NEW.submitted_at
  ) THEN
    RAISE EXCEPTION 'Commission inquiry submission fields are immutable and cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inquiry_immutable_fields
  BEFORE UPDATE ON public.commission_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.inquiry_protect_immutable_fields();

-- 4. Commission inquiry status lifecycle transition validator (Section 5.4.5)
CREATE OR REPLACE FUNCTION public.inquiry_validate_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- If status is not changing, allow update (e.g. updating admin_notes)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate permitted state transitions
  IF OLD.status = 'new' AND NEW.status IN ('reviewing', 'accepted', 'declined') THEN
    RETURN NEW;
  ELSIF OLD.status = 'reviewing' AND NEW.status IN ('accepted', 'declined') THEN
    RETURN NEW;
  ELSIF OLD.status = 'accepted' AND NEW.status IN ('reviewing', 'declined', 'completed') THEN
    RETURN NEW;
  ELSIF OLD.status = 'declined' AND NEW.status = 'reviewing' THEN
    RETURN NEW;
  ELSIF OLD.status = 'completed' AND NEW.status = 'accepted' THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Illegal inquiry status transition from % to %', OLD.status, NEW.status;
  END IF;
END;
$$;

CREATE TRIGGER trg_inquiry_status_transition
  BEFORE UPDATE OF status ON public.commission_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.inquiry_validate_status_transition();

-- 5. Atomic shared rate limiting function (Section 5.5.4 MUST)
-- Callable only via service-role / privileged client
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key_hash text,
  p_window_start timestamptz,
  p_max_attempts int
)
RETURNS TABLE (
  allowed boolean,
  current_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.inquiry_rate_limits (key_hash, window_start, attempt_count, last_attempt_at)
  VALUES (p_key_hash, p_window_start, 1, now())
  ON CONFLICT (key_hash, window_start)
  DO UPDATE SET
    attempt_count = public.inquiry_rate_limits.attempt_count + 1,
    last_attempt_at = now()
  RETURNING inquiry_rate_limits.attempt_count INTO v_count;

  RETURN QUERY SELECT (v_count <= p_max_attempts), v_count;
END;
$$;
