-- Migration: 20261023000002_security_rls_and_views.sql
-- Description: Row Level Security, explicit column grants, security-invoker public views,
-- and RPC execution privilege restrictions.

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Revoke broad table privileges from PUBLIC, anon, and authenticated
REVOKE ALL PRIVILEGES ON TABLE
  public.profiles,
  public.artworks,
  public.commission_offerings,
  public.commission_inquiries,
  public.pending_uploads,
  public.storage_cleanup_queue,
  public.inquiry_rate_limits
FROM PUBLIC, anon, authenticated;

-- Explicitly revoke sensitive column selects if any table grants existed
REVOKE SELECT (id, created_at, updated_at) ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE SELECT (private_image_path, profile_id, created_at, updated_at) ON TABLE public.artworks FROM PUBLIC, anon, authenticated;
REVOKE SELECT (profile_id, created_at, updated_at) ON TABLE public.commission_offerings FROM PUBLIC, anon, authenticated;

-- 3. Grant narrow public columns for anon and authenticated
GRANT SELECT (
  display_name, bio, avatar_path, contact_email, social_links,
  commission_availability, availability_message
) ON TABLE public.profiles TO anon, authenticated;

GRANT SELECT (
  id, title, slug, description, price_from, price_currency, display_order, is_active
) ON TABLE public.commission_offerings TO anon, authenticated;

GRANT SELECT (
  id, title, slug, description, alt_text, category, medium, tags,
  public_image_path, status, is_featured, published_at, search_vector
) ON TABLE public.artworks TO anon, authenticated;

-- 4. Row Level Security Policies
-- Profiles: public can read all profiles (only public columns granted)
CREATE POLICY profiles_public_read
  ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (true);

-- Commission Offerings: public can read active offerings only
CREATE POLICY offerings_public_read_active
  ON public.commission_offerings
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Artworks: public can read published artworks only
CREATE POLICY artworks_public_read_published
  ON public.artworks
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Operational & Private tables have NO policies for anon/authenticated (deliberate default-deny)
-- commission_inquiries, pending_uploads, storage_cleanup_queue, inquiry_rate_limits
-- are accessed exclusively by the server-only privileged client (service_role).

-- 5. Security-invoker public views (PostgreSQL 15+)
CREATE OR REPLACE VIEW public.public_profile
WITH (security_invoker = true) AS
SELECT
  display_name,
  bio,
  avatar_path,
  contact_email,
  social_links,
  commission_availability,
  CASE
    WHEN availability_message = '' OR availability_message IS NULL THEN
      CASE commission_availability
        WHEN 'open' THEN 'Commissions are currently open.'
        WHEN 'waitlist' THEN 'The commission waitlist is currently open.'
        WHEN 'closed' THEN 'Commissions are currently closed.'
      END
    ELSE availability_message
  END AS availability_message
FROM public.profiles;

CREATE OR REPLACE VIEW public.public_artworks
WITH (security_invoker = true) AS
SELECT
  id,
  title,
  slug,
  description,
  alt_text,
  category,
  medium,
  tags,
  public_image_path,
  status,
  is_featured,
  published_at
FROM public.artworks
WHERE status = 'published';

CREATE OR REPLACE VIEW public.public_commission_offerings
WITH (security_invoker = true) AS
SELECT
  id,
  title,
  slug,
  description,
  price_from,
  price_currency,
  display_order,
  is_active
FROM public.commission_offerings
WHERE is_active = true;

-- Grant SELECT on views to anon and authenticated
GRANT SELECT ON TABLE
  public.public_profile,
  public.public_artworks,
  public.public_commission_offerings
TO anon, authenticated;

-- 6. RPC Function Permissions (Section 5.11.6)
REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, timestamptz, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, timestamptz, int) TO service_role;
