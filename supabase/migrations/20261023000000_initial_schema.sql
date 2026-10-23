-- Migration: 20261023000000_initial_schema.sql
-- Description: Core business entities, operational tables, constraints, and indexes.

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name varchar(80) NOT NULL CHECK (length(trim(display_name)) >= 1),
  bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 2000),
  avatar_path text NULL,
  contact_email varchar(254) NULL,
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  commission_availability text NOT NULL DEFAULT 'open' CHECK (commission_availability IN ('open', 'waitlist', 'closed')),
  availability_message varchar(300) NOT NULL DEFAULT '' CHECK (length(availability_message) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create commission_offerings table
CREATE TABLE IF NOT EXISTS public.commission_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title varchar(120) NOT NULL CHECK (length(trim(title)) >= 1),
  slug varchar(160) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  price_from numeric(12,2) NULL CHECK (price_from IS NULL OR price_from >= 0),
  price_currency char(3) NOT NULL DEFAULT 'IDR',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create artworks table
CREATE TABLE IF NOT EXISTS public.artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title varchar(120) NOT NULL CHECK (length(trim(title)) >= 1),
  slug varchar(160) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 4000),
  alt_text varchar(250) NOT NULL CHECK (length(trim(alt_text)) >= 1),
  category varchar(60) NOT NULL DEFAULT 'other' CHECK (category IN ('original-character', 'fan-art', 'portrait', 'landscape', 'other')),
  medium varchar(60) NOT NULL DEFAULT 'digital-painting' CHECK (medium IN ('digital-painting', 'pixel-art', 'vector', 'traditional', 'mixed-media', 'other')),
  tags text[] NOT NULL DEFAULT ARRAY[]::text[] CHECK (cardinality(tags) <= 20),
  search_vector tsvector NOT NULL DEFAULT ''::tsvector,
  private_image_path text NOT NULL UNIQUE,
  public_image_path text NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured boolean NOT NULL DEFAULT false,
  published_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_artwork_status_invariants CHECK (
    (status = 'draft' AND published_at IS NULL AND public_image_path IS NULL AND is_featured = false)
    OR
    (status = 'published' AND published_at IS NOT NULL AND public_image_path IS NOT NULL)
  )
);

-- 5. Create commission_inquiries table
CREATE TABLE IF NOT EXISTS public.commission_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name varchar(100) NOT NULL CHECK (length(trim(client_name)) >= 1),
  client_email varchar(254) NOT NULL CHECK (length(trim(client_email)) >= 3),
  offering_id uuid NULL REFERENCES public.commission_offerings(id) ON DELETE RESTRICT,
  offering_title_snapshot varchar(120) NOT NULL CHECK (length(trim(offering_title_snapshot)) >= 1),
  description text NOT NULL CHECK (length(trim(description)) >= 20 AND length(description) <= 4000),
  budget_amount numeric(12,2) NULL CHECK (budget_amount IS NULL OR budget_amount >= 0),
  budget_currency char(3) NOT NULL DEFAULT 'IDR',
  desired_deadline date NULL,
  availability_at_submission text NOT NULL CHECK (availability_at_submission IN ('open', 'waitlist')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'declined', 'completed')),
  admin_notes text NULL CHECK (admin_notes IS NULL OR length(admin_notes) <= 4000),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Create pending_uploads table
CREATE TABLE IF NOT EXISTS public.pending_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  purpose text NOT NULL CHECK (purpose IN ('artwork_source', 'profile_avatar')),
  bucket_id text NOT NULL DEFAULT 'artworks-private' CHECK (bucket_id = 'artworks-private'),
  object_path text NOT NULL UNIQUE,
  original_filename varchar(255) NULL,
  declared_content_type varchar(100) NULL,
  declared_size_bytes bigint NULL,
  detected_content_type varchar(100) NULL,
  actual_size_bytes bigint NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'validated', 'consumed', 'rejected', 'cleanup_pending')),
  expires_at timestamptz NOT NULL,
  signed_upload_issued_at timestamptz NULL,
  signed_upload_expires_at timestamptz NULL,
  cleanup_after timestamptz NOT NULL DEFAULT (now() + interval '2 hours 10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create storage_cleanup_queue table
CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL CHECK (bucket_id IN ('artworks-private', 'artworks-public', 'profiles-public')),
  object_path text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('unpublish', 'replace', 'delete', 'rollback', 'expired_upload')),
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'processing')),
  process_after timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_attempt_at timestamptz NULL,
  last_error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_cleanup_bucket_path UNIQUE (bucket_id, object_path)
);

-- 8. Create inquiry_rate_limits table (COM-004 MUST)
CREATE TABLE IF NOT EXISTS public.inquiry_rate_limits (
  key_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key_hash, window_start)
);

-- 9. Indexes from Blueprint Section 5.9
CREATE INDEX IF NOT EXISTS idx_artworks_status_published_at ON public.artworks (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_profile_created_at ON public.artworks (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_search_vector ON public.artworks USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_artworks_tags ON public.artworks USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_offerings_public_order ON public.commission_offerings (is_active, display_order, created_at);

CREATE INDEX IF NOT EXISTS idx_inquiries_status_submitted_at ON public.commission_inquiries (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_new_partial ON public.commission_inquiries (submitted_at DESC) WHERE (status = 'new');
CREATE INDEX IF NOT EXISTS idx_inquiries_offering_id ON public.commission_inquiries (offering_id);

CREATE INDEX IF NOT EXISTS idx_pending_uploads_state_expires ON public.pending_uploads (state, expires_at);
CREATE INDEX IF NOT EXISTS idx_cleanup_queue_state_process ON public.storage_cleanup_queue (state, process_after, created_at);
