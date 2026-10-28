-- Migration: 20261028000000_add_artwork_preview_image.sql
-- Store a pre-generated, high-quality public preview so animated panels and
-- artwork detail pages can show the work immediately without runtime resampling.
-- The private original remains private; this is a metadata-stripped WebP derivative.

ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS public_preview_path text NULL;

GRANT SELECT (public_preview_path)
  ON TABLE public.artworks TO anon, authenticated;

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
  palette_metadata,
  image_width,
  image_height,
  public_preview_path
FROM public.artworks
WHERE status = 'published';

GRANT SELECT ON TABLE public.public_artworks TO anon, authenticated;
