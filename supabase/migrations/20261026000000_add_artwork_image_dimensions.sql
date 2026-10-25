-- Migration: 20261026000000_add_artwork_image_dimensions.sql
-- Persist orientation-corrected image dimensions as safe presentation metadata.
-- Private source paths and source-file metadata remain private.

ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS image_width integer NULL
    CHECK (image_width IS NULL OR image_width BETWEEN 1 AND 10000),
  ADD COLUMN IF NOT EXISTS image_height integer NULL
    CHECK (image_height IS NULL OR image_height BETWEEN 1 AND 10000);

GRANT SELECT (
  id, title, slug, description, alt_text, category, medium, tags,
  public_image_path, status, is_featured, published_at, search_vector,
  palette_metadata, image_width, image_height
) ON TABLE public.artworks TO anon, authenticated;

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
  image_height
FROM public.artworks
WHERE status = 'published';

GRANT SELECT ON TABLE public.public_artworks TO anon, authenticated;
