-- Seed Data for Karyora Local / Development Environment
-- Blueprint Section 5.11.2

-- 1. Create administrator profile
-- In production, the id is the real Supabase Auth user ID
INSERT INTO public.profiles (
  id,
  display_name,
  bio,
  avatar_path,
  contact_email,
  social_links,
  commission_availability,
  availability_message
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Karyora Artist',
  'Independent visual artist and illustrator specializing in imaginative character design, atmospheric environmental painting, and narrative digital art.',
  'profiles-public/artist/avatar/seed-avatar-01.webp',
  'artist@karyora.internal',
  '{"twitter": "https://x.com/karyora", "artstation": "https://artstation.com/karyora"}'::jsonb,
  'open',
  'Commissions are currently open for personal and commercial projects.'
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  commission_availability = EXCLUDED.commission_availability;

-- 2. Seed commission offerings
INSERT INTO public.commission_offerings (
  id,
  profile_id,
  title,
  slug,
  description,
  price_from,
  price_currency,
  is_active,
  display_order
) VALUES
(
  '11111111-1111-1111-1111-111111111101',
  '00000000-0000-0000-0000-000000000000',
  'Character Portrait / Bust',
  'character-portrait-bust',
  'Detailed head-and-shoulders character portrait with expressive lighting, rendered textures, and stylized atmospheric backdrop.',
  500000.00,
  'IDR',
  true,
  1
),
(
  '11111111-1111-1111-1111-111111111102',
  '00000000-0000-0000-0000-000000000000',
  'Half-Body Illustration',
  'half-body-illustration',
  'Dynamic waist-up character framing featuring detailed costume rendering, props or weapons, and atmospheric lighting effects.',
  900000.00,
  'IDR',
  true,
  2
),
(
  '11111111-1111-1111-1111-111111111103',
  '00000000-0000-0000-0000-000000000000',
  'Full Illustration & Environment',
  'full-illustration-environment',
  'Complete narrative painting with full-figure character integration, perspective environmental background, and cinematic lighting.',
  1500000.00,
  'IDR',
  true,
  3
),
(
  '11111111-1111-1111-1111-111111111104',
  '00000000-0000-0000-0000-000000000000',
  'Legacy Concept Sketch (Retired)',
  'legacy-concept-sketch',
  'Preliminary exploratory concept sketching. Currently retired and kept for historical reference.',
  250000.00,
  'IDR',
  false,
  4
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed artworks (Published and Draft)
INSERT INTO public.artworks (
  id,
  profile_id,
  title,
  slug,
  description,
  alt_text,
  category,
  medium,
  tags,
  private_image_path,
  public_image_path,
  status,
  is_featured,
  published_at
) VALUES
(
  '22222222-2222-2222-2222-222222222201',
  '00000000-0000-0000-0000-000000000000',
  'Solitude in Crimson',
  'solitude-in-crimson',
  'An ethereal character study exploring autumn twilight, quiet contemplation, and textured fabric rendering.',
  'A crimson-cloaked figure gazing out over misty mountain valleys during autumn dusk.',
  'original-character',
  'digital-painting',
  ARRAY['character', 'crimson', 'autumn', 'twilight'],
  'artworks-private/00000000-0000-0000-0000-000000000000/art-01/source.png',
  'artworks-public/artworks/22222222-2222-2222-2222-222222222201/v1.webp',
  'published',
  true,
  now() - interval '5 days'
),
(
  '22222222-2222-2222-2222-222222222202',
  '00000000-0000-0000-0000-000000000000',
  'Whispering Pines',
  'whispering-pines',
  'Environmental study of morning sunlight filtering through an alpine evergreen canopy.',
  'Sunbeams breaking through a dense evergreen pine forest with soft morning mist.',
  'landscape',
  'digital-painting',
  ARRAY['landscape', 'forest', 'morning', 'environment'],
  'artworks-private/00000000-0000-0000-0000-000000000000/art-02/source.png',
  'artworks-public/artworks/22222222-2222-2222-2222-222222222202/v1.webp',
  'published',
  false,
  now() - interval '12 days'
),
(
  '22222222-2222-2222-2222-222222222203',
  '00000000-0000-0000-0000-000000000000',
  'Study in Charcoal 04',
  'study-in-charcoal-04',
  'WIP tonal value study focusing on anatomical forms and chiaroscuro lighting.',
  'Rough chiaroscuro portrait study showing anatomical values in black and white.',
  'portrait',
  'digital-painting',
  ARRAY['study', 'monochrome', 'wip'],
  'artworks-private/00000000-0000-0000-0000-000000000000/art-03/source.png',
  NULL,
  'draft',
  false,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed sample commission inquiries
INSERT INTO public.commission_inquiries (
  id,
  client_name,
  client_email,
  offering_id,
  offering_title_snapshot,
  description,
  budget_amount,
  budget_currency,
  desired_deadline,
  availability_at_submission,
  status,
  admin_notes,
  submitted_at
) VALUES
(
  '33333333-3333-3333-3333-333333333301',
  'Maya Lin',
  'maya@example.com',
  '11111111-1111-1111-1111-111111111101',
  'Character Portrait / Bust',
  'I would like a digital portrait of my elven sorceress character with silver hair, dark robes with gold embroidery, and subtle magical particle effects.',
  600000.00,
  'IDR',
  CURRENT_DATE + interval '30 days',
  'open',
  'new',
  NULL,
  now() - interval '2 hours'
),
(
  '33333333-3333-3333-3333-333333333302',
  'Julian Fox',
  'julian@example.com',
  '11111111-1111-1111-1111-111111111103',
  'Full Illustration & Environment',
  'Looking for a full key visual book illustration featuring two adventurers standing in front of an ancient ruined gate in a glowing twilight cavern.',
  1800000.00,
  'IDR',
  CURRENT_DATE + interval '45 days',
  'open',
  'reviewing',
  'Sent preliminary moodboard questions on email; awaiting response on character attire details.',
  now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;
