-- Migration: 20261025000000_add_artwork_palette_metadata.sql
-- Description: Adds palette_metadata jsonb column to public.artworks,
-- updates column grants for anon and authenticated roles,
-- and recreates public_artworks view with palette_metadata exposed.

-- 1. Add palette_metadata column to public.artworks
ALTER TABLE public.artworks
ADD COLUMN IF NOT EXISTS palette_metadata jsonb NULL;

-- 2. Update column-level SELECT grants for anon and authenticated roles
GRANT SELECT (
  id, title, slug, description, alt_text, category, medium, tags,
  public_image_path, status, is_featured, published_at, search_vector,
  palette_metadata
) ON TABLE public.artworks TO anon, authenticated;

-- 3. Recreate public_artworks security-invoker view to expose palette_metadata
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
  published_at,
  palette_metadata
FROM public.artworks
WHERE status = 'published';

-- 4. Grant SELECT on updated view
GRANT SELECT ON TABLE public.public_artworks TO anon, authenticated;
