# Karyora Visual Direction & Homepage Redesign Brief

**Status:** Design direction approved as a working brief.  
**Scope:** Public-facing experience first, starting with the homepage and featured artwork showcase.  
**Product identity:** Karyora, an independent artist portfolio and commission inquiry platform.  
**Implementation baseline:** Existing Next.js App Router application, Tailwind CSS v4 tokens, Alex Brush, Caveat, DM Sans, Supabase-backed artwork data.  
**Rule:** Improve the existing MVP in small, reviewable changes. Do not rebuild working functionality just to change the visual presentation.

---

## 1. The intended result

Karyora should feel like **entering an artist's curated digital exhibition**, not opening a generic portfolio template or a SaaS landing page.

The public website should be art-directed, editorial, image-led, and quietly interactive. It can feel unusual and memorable, but every unusual choice must help a visitor discover an artwork, understand the artist, or start a commission inquiry.

The core experience should combine:

- **Robin Noguier:** confident composition, art-directed project imagery, layered/angled visual rhythm, and concise editorial storytelling.
- **Alan Menken's interactive song showcase:** one visually dominant selected work, supporting vertical artwork panels, subdued neighboring works, and sparse, deliberate controls.
- **KERN Inc.:** restrained layout, explicit project index, selected-work metadata, and a compact thumbnail/icon dock that lets the visitor change the featured work.

These are design references, not templates to copy. Karyora must use its own artwork, existing brand palette, content, and personality. Do not reproduce another site's logo, artwork, exact composition, or distinctive proprietary assets.

## 2. Reference links and what to learn from them

### A. Robin Noguier

- Live site: https://robin-noguier.com/
- Archived visual example: https://www.landing.love/sites/robin-noguier/
- FWA portfolio record: https://thefwa.com/cases/robin-noguier-portfolio
- Project case study: https://robin-noguier.com/project/ueno/

**Learn from:** strong project-led hierarchy; large, confident titles; a short explanation adjacent to visual work; image panels with varied scale/angle; meaningful movement between projects; relatively quiet navigation.

**Translate to Karyora:** allow a selected artwork and its title to become the visual event. If angled or layered image panels are used, use them sparingly as a deliberate framing device. Preserve a direct, unmistakable route to the complete gallery and each artwork detail page.

**Do not copy:** Robin's particular color palette, copywriting, exact panel shapes, or portfolio-specific identity.

### B. Alan Menken's interactive showcase

- Official site: https://www.alanmenken.com/
- Awwwards reference capture: https://www.awwwards.com/sites/alan-menken
- Studio case study: https://www.hellomonday.com/work/alan-menken

The current official site may present a different page structure from the classic interactive showcase. Use the linked Awwwards capture and studio case study when reasoning about the well-known selected-song / vertical-panel interaction.

**Learn from:** one selected image is saturated and dominant; adjacent vertical panels create anticipation and context; inactive selections recede; the frame and controls stay quiet; the selected title and index explain what is being viewed.

**Translate to Karyora:** keep the selected artwork unmistakably primary. Use other artworks as glimpses of the archive, not as equally loud competing tiles. The image itself should supply most of the color and visual interest.

**Do not copy:** Disney character imagery, Alan Menken's signature, the exact strip geometry, or the same type treatment.

### C. KERN Inc.

- Live site: https://kern.inc/en/
- Project/site feature: https://supercrowds.co/projects/kern/

**Learn from:** sparse page chrome; an obvious selected-project state; clear project index and metadata; a compact dock/row of project thumbnails or icons; restrained typography and generous space.

**Translate to Karyora:** keep one concise navigation system for the showcase, pair the active piece with useful metadata, and make choosing another piece direct and predictable.

**Do not copy:** KERN's exact project card, icon set, typography, yellow/peach palette, or composition.

## 3. Verified current implementation

The current public homepage and showcase are implemented in:

- `src/app/(public)/page.tsx`
- `src/components/gallery/ArtworkStageShowcase.tsx`
- `src/components/layout/PublicHeader.tsx`
- `src/components/layout/PublicFooter.tsx`
- `src/app/(public)/gallery/page.tsx`
- `src/app/(public)/artworks/[slug]/page.tsx`
- `src/app/globals.css`

The current homepage has an editorial index/status bar, a centered headline and bio with two CTAs, a separately labeled spotlight section, the interactive artwork stage, and a commission CTA.

The showcase currently:
- requests up to eight featured published artworks;
- gives the active panel a wider flex ratio, and renders the other artworks as narrow vertical strips on desktop;
- dims and desaturates inactive strips, with vertical title labels;
- shows a single portrait-oriented slide and previous/next buttons on mobile;
- shows title/category/medium and a detail link under the stage;
- adds a second selection dock with thumbnails and another previous/next control;
- also places a detail link over the active desktop panel.

The existing design tokens in `src/app/globals.css` are a useful starting point:

- Paper: `#FAF8F3`
- Surface: `#FFFEFC`
- Surface muted: `#F3EFE8`
- Ink: `#1C1917`
- Soft ink: `#44403C`
- Muted text: `#78716C`
- Border: `#E7E0D6`
- Terracotta accent: `#B85C45`
- Accent hover: `#8F3F2A`
- Fonts: Alex Brush + Caveat + DM Sans

Keep these tokens as the starting palette and type system. Adjust them only when a specific contrast, hierarchy, or visual problem is demonstrated.

This is a source-code review, not confirmation that every deployed state has been visually inspected in a real browser. Verify actual rendering at target viewport sizes before claiming a visual fix is complete.

## 4. Main design diagnosis

The current implementation contains the right ingredients, but it risks presenting too many layers of interface at once:

1. The headline hero is a full section before the featured artwork stage. On many viewports this can delay the most distinctive, image-led interaction.
2. The stage, the active-artwork title block, and the thumbnail dock each repeat part of the selection/navigation experience.
3. The active panel, vertical labels, numeric labels, category/medium index, quoted alt text, status language, and multiple calls to action compete for attention.
4. Eight panels can make inactive artworks too narrow to read or appreciate.
5. Repeated small uppercase/monospaced labels and numerous borders can make the composition feel like an editorial dashboard rather than a living exhibition.
6. The active artwork's title and detail action are presented both over the image and below the stage. Decide on a single clear primary detail action.
7. The current component displays `alt_text` as a quoted italic caption. Alternative text is an accessibility description, not necessarily an artist-written caption. Do not present it as narrative copy. Use an actual narrative field if the data model has one; otherwise omit the quotation.
8. The desktop panels are clickable `div` elements with button semantics and contain a link. Keep interaction semantics unambiguous; do not create nested or competing interactive controls.
9. The global ArrowLeft/ArrowRight listener should not hijack keyboard input while a visitor is typing or interacting with unrelated controls. Keep keyboard behavior scoped and predictable.

Treat these as design and interaction questions to resolve, not permission to delete functional features without a replacement.

## 5. Recommended public homepage concept

### The opening composition

The artwork experience should become the homepage's main visual anchor. Integrate the introductory statement and the featured piece into one coherent first-screen composition instead of allowing the site to read as a generic headline, two buttons, and then a separate gallery widget.

A useful direction to prototype:

- Keep a small, calm brand/navigation header.
- Use one short editorial statement, with the artwork or selected-artwork title carrying more weight than the generic explanation.
- Give one selected artwork a large, intentional frame with enough space for its composition to read.
- Use a few neighboring image slivers or offset panels as hints of the archive. These must support the selected piece, not become eight competing equal-weight columns.
- Keep the active artwork title, category/medium, index, and one detail action adjacent to the stage in a deliberate and readable hierarchy.
- Retain a clear route to the full gallery and a visible route to commissions, but avoid giving every action equal visual prominence.
- Keep the commission CTA below the artwork experience as a natural next step.

Do not require an exact pixel-level imitation of any reference. Create a distinct Karyora composition informed by those patterns.

### The featured-artwork interaction

Use one coherent selection model. Visitors should understand which work is selected, how to change the selection, and how to open its detail page without decoding the UI.

Recommended constraints:

- Show one dominant active artwork with restrained glimpses of neighboring works.
- Avoid compressing many artworks into unreadable slivers. If necessary, show fewer panels while keeping every artwork accessible via the full gallery and selection dock.
- Make the selected state obvious without relying only on color.
- Keep the thumbnail dock visually compact and subordinate to the artwork.
- Avoid duplicating the same detail link and navigation affordances in multiple places.
- Use deliberate transitions when selecting artworks; do not autoplay artwork changes by default.
- Support click/tap, keyboard focus, visible focus indicators, and reduced-motion preferences.
- On mobile, prioritize a readable single artwork, its title, a direct detail link, and simple previous/next or thumbnail selection. Do not scale the desktop strip interaction down until it becomes cramped.
- Preserve the actual artwork composition. Use `object-cover` only when cropping is intentional; do not cut off important characters or focal elements just to fill a rectangle.
- Give missing-image and zero-artwork states an intentional, designed treatment.

### Typography and color

- Use Alex Brush for the Karyora wordmark and every artwork title, including spotlight, gallery, and artwork-detail contexts. Use Caveat only for short artwork descriptions on artwork-detail pages. Use DM Sans for navigation, all non-artwork headings, body copy, labels, forms, and controls. Do not use DM Serif Display in the active design system.
- Reserve monospace/overtracked uppercase type for occasional indices, categories, or technical metadata. Do not apply it to every label.
- Maintain a warm paper/ink foundation with terracotta as a focused accent.
- Let the artwork provide the primary color; avoid adding multiple decorative accent colors without a clear role.
- Use whitespace and alignment before adding borders, boxes, badges, gradients, or shadows.
- Use a shared hamburger-triggered navigation overlay across the public routes. The navigation must not be sticky. The shared public footer is intentionally omitted; page-specific artwork navigation docks remain part of the exhibition experience.
- Keep public UI visually expressive and the admin interface operational. Do not impose the public artwork-stage concept on CRUD forms or inquiry management.

## 6. Principles for animation and interaction

Motion should clarify focus and make changing artworks feel intentional.

- Prefer one coordinated transition system over many unrelated micro-animations.
- Animate selection, image scale/position, and secondary-panel emphasis with restrained easing.
- Avoid gratuitous pulsing, perpetual movement, excessive parallax, or motion that delays access to content.
- Ensure the layout is understandable before animations run and remains usable if motion is reduced or unavailable.
- Respect `prefers-reduced-motion`.
- Keep controls usable with keyboard and touch; do not make hover the only way to discover titles or actions.
- Prevent arrow-key handling from interfering with text fields, buttons, assistive technology, or the rest of the page.
- Provide visible focus states and adequate text/background contrast.
- Keep all artwork detail links, gallery filters, commission links, and header navigation functional.

## 7. Hard constraints: visual work must not break the MVP

A visual redesign is not permission to change application behavior.

- Keep the current route contracts and public content behavior intact.
- Keep artwork data backed by the existing database. Do not replace it with hardcoded sample artwork or invented metadata.
- Preserve published/draft visibility rules.
- Preserve image privacy, signed upload behavior, public derivative processing, and metadata stripping.
- Do not expose private source images, inquiry data, administrator details, server secrets, or privileged Supabase clients to the public UI.
- Do not weaken server-side authorization or database protections to make a UI state easier to render.
- Keep accessibility alternative text distinct from any future narrative/caption field.
- Avoid schema changes unless a specific, necessary product requirement is identified and reviewed.
- Keep admin components and their workflows stable during the public homepage redesign unless explicitly included in the task.
- Use existing shared design tokens/components when appropriate; extend them coherently rather than scattering one-off colors and styles.
- Make changes in small steps and report exactly which checks ran.

## 8. Recommended implementation order

### Phase 1: Audit and baseline
1. Run the current application locally and inspect the homepage at desktop and mobile sizes.
2. Capture baseline screenshots at approximately 1440 × 900, 1024 × 768, and 390 × 844.
3. Verify which parts of the site are protected by auth and which are publicly accessible.
4. Record any existing errors or layout problems before changing code.

### Phase 2: Composition
1. Prototype the first viewport and the featured-artwork stage as one composition.
2. Simplify the hierarchy and remove duplicated labels/actions.
3. Decide how many neighboring panels are useful at desktop widths.
4. Establish one clear active-work metadata area and one clear selection/navigation model.

### Phase 3: Interaction and responsive behavior
1. Refine selection transitions and the dock.
2. Fix keyboard and semantic interaction behavior.
3. Design the mobile stage specifically for touch.
4. Add empty, loading, and error states where needed.

### Phase 4: Gallery coherence
1. Bring the gallery index, artwork detail, and commission pages into the same visual language.
2. Keep these pages focused on their own user tasks rather than forcing the homepage interaction onto every route.
3. Leave the admin studio's information-dense workflows functional and usable.

### Phase 5: Verification
1. Compare before/after screenshots at the same viewport sizes.
2. Test all links and selection controls with mouse, keyboard, and touch.
3. Test `prefers-reduced-motion` and keyboard focus.
4. Check contrast, text wrapping, image cropping, overflow, and mobile navigation.
5. Run the repository's available lint/build/type checks. Do not claim a check passed unless it was actually run.
6. Confirm that Supabase-backed data and all existing CRUD, publishing, and inquiry behaviors remain unchanged.

## 9. Acceptance criteria for the homepage redesign

The redesign is ready for review when:

- The selected artwork is the primary visual focus without confusing competing elements.
- The opening composition feels intentional and specific to Karyora, not like a generic template.
- The three inspirations are translated into a coherent original design rather than visibly stacked together.
- Visitors can identify the selected artwork, switch to another, and open its detail page easily.
- The selection dock, active artwork details, and calls to action have a clear hierarchy without redundant UI.
- Desktop and mobile layouts each feel deliberately composed.
- Motion is restrained, optional for reduced-motion users, and never required to understand the page.
- All existing public routes and functionality remain intact.
- The changes are verified at real viewport sizes and the change report is honest about what was and was not tested.

## 10. Agent workflow for UI tasks

Before implementing a public-facing UI task, the agent MUST:

1. Read this brief and the relevant `AGENTS.md` rules.
2. Inspect the current component and its imported components/data. Do not assume the code still matches this brief.
3. Open the reference links if browsing is available. If it is not available, use the observations in sections 2–5 rather than inventing details.
4. State the intended change in concrete layout/interaction terms before editing.
5. Preserve working data, routes, access controls, and form behavior.
6. Make the smallest coherent change.
7. Run available checks and inspect the result in a browser at desktop and mobile sizes when an environment is available.
8. Report files changed, checks run, visual limitations, and remaining work.

An instruction such as “make it more like Robin Noguier / Alan Menken / KERN” is not sufficient by itself. Use this file to translate that preference into actual layout, hierarchy, motion, and interaction decisions.


## Approved homepage viewport implementation

The homepage artwork stage must remain edge-to-edge and preserve both interactive viewport modes. Ribbons displays one selected artwork with subdued, intentionally cropped neighboring previews; Sliced renders five staggered strips from a single aspect-ratio-correct source composition. Do not remove either mode as a layout simplification.

The selected artwork must never be stretched or cropped to fit a fixed portrait card. Fit its true image dimensions inside the available width and height. Cropping is allowed for secondary ribbons previews only. Sliced strips must share one scaled image coordinate system, with gaps inserted between strips rather than stretching the image across a fixed-width background.

Keep the artwork viewport full-width, keep preview gaps bounded, reduce the number of visible neighboring panels on narrower screens, and keep the active artwork centered. Place the title, description, and medium/category metadata below the viewport. The bottom bar contains the archive link, the two-mode control, and the commission inquiry link; avoid decorative audio icons and redundant showcase captions.
Image dimensions are stored as nullable image_width/image_height presentation metadata, extracted after orientation is applied. Existing published rows without dimensions must fall back to the browser's natural image dimensions after load. This metadata does not change private-image access rules.
