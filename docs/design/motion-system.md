# Karyora Motion System

**Status:** Implemented baseline  
**Scope:** Public website motion, including Gallery, homepage showcase, navigation, and Artwork Detail.  
**Source of truth:** Motion custom properties in `src/app/globals.css`. Runtime code that uses the Web Animations API must read these CSS tokens through `src/lib/motion/motion-tokens.ts`. Do not maintain a second independent list of production durations in TypeScript.

## Intent

Karyora's motion should feel editorial and composed rather than uniformly animated. Every transition should help the visitor follow focus, understand a change, or enjoy the artwork. Panel groups should move in a deliberate sequence, not as one rigid block.

The system has four rules:

1. **One timing vocabulary.** Shared durations, easings, and stagger intervals live in CSS custom properties.
2. **Motion has hierarchy.** Tiny controls respond quickly; large artwork compositions receive more time.
3. **Sequences have rhythm.** Ribbon movement follows the selected artwork; Sliced reveals pieces in a directional cascade; Artwork Detail stages the three-card stack.
4. **Motion never gates access.** Reduced-motion users get immediate or near-immediate state changes, and transitions do not autoplay artwork changes.

## Canonical motion tokens

Values below must match the tokens in `:root` in `globals.css`.

| Token | Baseline | Intended use |
|---|---:|---|
| `--motion-duration-micro` | 180 ms | Hover, icons, color changes |
| `--motion-duration-ui` | 280 ms | Navigation backdrop and small UI state changes |
| `--motion-duration-navigation` | 460 ms | Full navigation panel movement |
| `--motion-duration-image` | 720 ms | Gentle image-scale emphasis |
| `--motion-duration-spotlight` | 720 ms | Homepage active-panel width and emphasis |
| `--motion-duration-ribbon-enter` | 820 ms | Ribbon preview entrance |
| `--motion-duration-ribbon-focus` | 960 ms | Ribbon focused panel entrance |
| `--motion-duration-ribbon-near` | 920 ms | Artwork transition, panels one offset from focus |
| `--motion-duration-ribbon-middle` | 860 ms | Artwork transition, panels two offsets from focus |
| `--motion-duration-ribbon-far` | 800 ms | Artwork transition, panels three or more offsets away |
| `--motion-stagger-ribbon-step` | 58 ms | Per-offset Ribbon delay |
| `--motion-stagger-ribbon-tie` | 10 ms | Soft directional offset between mirrored Ribbon panels |
| `--motion-stagger-ribbon-cap` | 232 ms | Maximum Ribbon transition delay |
| `--motion-buffer-ribbon-enter` | 100 ms | Keeps the initial Ribbon animation class through its final frame |
| `--motion-duration-slice-panel` | 680 ms | Sliced enter/exit panel motion |
| `--motion-stagger-slice-step` | 60 ms | Per-ring Sliced delay |
| `--motion-stagger-slice-tie` | 12 ms | Directional offset between paired side slices |
| `--motion-delay-slice-initial` | 20 ms | Default Sliced entrance start |
| `--motion-delay-slice-handoff` | 920 ms | Sliced entry after a large-layout outgoing handoff |
| `--motion-buffer-slice-safety` | 180 ms | Safety margin after staggered Sliced animation |
| `--motion-duration-caption-title` | 340 ms | Incoming artwork title |
| `--motion-duration-caption-description` | 390 ms | Incoming artwork description |
| `--motion-duration-caption-meta` | 330 ms | Incoming artwork supporting metadata |
| `--motion-delay-caption-description` | 60 ms | Description start after title |
| `--motion-delay-caption-meta` | 100 ms | Metadata start after title |
| `--motion-duration-detail-exit-rear` | 430 ms | Rear card exit |
| `--motion-duration-detail-exit-middle` | 470 ms | Middle card exit |
| `--motion-duration-detail-exit-front` | 510 ms | Front card exit |
| `--motion-duration-detail-enter-rear` | 540 ms | Rear card entrance |
| `--motion-duration-detail-enter-middle` | 600 ms | Middle card entrance |
| `--motion-duration-detail-enter-front` | 660 ms | Front card entrance |
| `--motion-stagger-detail-step` | 50 ms | Detail stack layer delay |
| `--motion-duration-detail-exit-total` | 680 ms | Safety deadline for outgoing stack |
| `--motion-duration-detail-enter-total` | 800 ms | Safety deadline for incoming stack |
| `--motion-duration-detail-meta` | 380 ms | Metadata reveal |
| `--motion-delay-detail-meta` | 120 ms | Metadata reveal after artwork starts arriving |
| `--motion-duration-reduced` | 120 ms | Minimal fallback for reduced-motion changes |
| `--motion-duration-reduced-navigation` | 250 ms | Brief state lock when animated slices are disabled |

### Easing tokens

| Token | Value | Intended use |
|---|---|---|
| `--motion-ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | Layout and image transitions with confident deceleration |
| `--motion-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering emphasis and spotlight panels |
| `--motion-ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exiting elements that gather momentum |
| `--motion-ease-spring` | `cubic-bezier(0.22, 1.12, 0.36, 1)` | Restrained overshoot on arriving elements |

CSS keyframes and JavaScript animations must use the same easing token when they describe the same geometric transition. When the Ribbon image crop is interpolated independently from its frame, calculate its crop keyframes against that same easing curve.

## Choreography by component

### Ribbon

- Initial entrance: centered/focused panel starts first. Other visible panels use a CSS-token-based delay based on their absolute offset from the active artwork. Mirrored panels receive a small 10 ms directional tie, capped by the shared 232 ms maximum.
- Selection changes: the selected artwork's layout box starts immediately. Adjacent panels follow after 58 ms per offset, capped at 232 ms.
- Durations vary by distance: focus 960 ms, near 920 ms, middle 860 ms, far 800 ms.
- The image crop follows the frame's easing progression; do not independently delay or distort the image.
- Circular-wrap panels still enter from beyond the clipped stage edge, avoiding travel across the entire viewport.
- Navigation and FLIP remain disabled for reduced-motion preferences only insofar as visual movement is omitted; selection and other functionality remain available.

### Sliced

- Five slices reveal in three rings: center at 0 ms, inner pair at 60 ms (plus a 12 ms directional tie), outer pair at 120 ms (plus the same tie).
- The tie-break is directional: next favors the left panel in each pair; previous favors the right. Outgoing layers deconstruct in reverse ring order, starting at the outside.
- A major artwork-layout handoff waits until the outgoing slices clear the stage. The transition snapshot cleanup deadline remains handoff delay + maximum stagger + incoming duration + the shared 180 ms safety margin.
- Slice crops stay fixed to their shared source artwork. Do not animate per-slice image dimensions independently.

### Artwork Detail

- Preserve the physical three-card idea: rear card starts first, then middle, then front. The front card finishes last and remains the synchronization point for swapping artwork data.
- Exit uses accelerating easing; entrance uses the restrained spring easing.
- Expected overall interaction is about 1.3–1.5 seconds including the outgoing and incoming phases. Do not shorten the safety fallback below the longest configured layer animation plus its delay.
- Metadata appears slightly after the incoming image starts, never before the artwork is visible.
- Respect the current reduced-motion behavior and keep the wheel/keyboard interaction lock active during the transition.

### Homepage, navigation, and archive index

- Homepage spotlight width transitions use the spotlight token; its image scale uses the image token.
- Navigation panel motion uses the dedicated 460 ms navigation duration and standard easing; backdrop fade uses the 280 ms UI duration.
- Archive index highlights and arrows use micro motion. Artwork image emphasis remains slower than label changes.
- Avoid adding new perpetual animations or using large-area layout transitions for tiny hover feedback.

## Reduced motion

Honor `prefers-reduced-motion: reduce`. Use the existing reduced-motion branch where available. New sequences must not require a full-screen delay to access content. Do not remove the visible selected state, keyboard support, or image content when motion is reduced.

## Verification checklist

- [ ] Run `npm run test:motion-system` for token coverage, directional slice order, and easing progress.
- [ ] Run artwork layout and interaction regression tests.
- [ ] Run ESLint and production build.
- [ ] Verify Ribbon transitions with 2, 5, and 9 artworks at 360, 768, and 1280 CSS px.
- [ ] Verify Sliced previous/next order and large portrait/landscape handoff.
- [ ] Verify Artwork Detail completes in both directions and its safety fallback cannot interrupt a normal animation.
- [ ] Verify navigation, hover, and archive index still respond promptly.
- [ ] Verify reduced-motion behavior and keyboard operation.
