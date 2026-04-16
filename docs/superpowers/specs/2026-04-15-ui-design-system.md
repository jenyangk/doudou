# Sub-Project 2: UI/Design System — Specification

**Date:** 2026-04-15
**Depends on:** Sub-Project 1 (Foundation) — complete
**Scope:** Visual restyling of all existing pages and components. No new features or backend changes.

---

## Design Direction

- **Style:** Rubber-hose shape language only — organic rounded shapes, squishy/elastic feel. No illustrations or mascot characters.
- **Palette:** "Toontown" — saturated primaries/secondaries with warm undertones.
- **Typography:** Rounded friendly — Nunito (display/headings) + Nunito Sans (body).
- **Animations:** Playful bouncy — noticeable but controlled GSAP animations.
- **Theme:** Light mode only.
- **Transitions:** Full route transitions with GSAP enter/exit animations.
- **Gallery style:** Borderless photo cards (image fills card, vote button overlays).
- **Session header:** Prominent session code badge, copy-on-click.

---

## Section 1: Design Tokens

| Token | Value |
|-------|-------|
| Primary | `#E05A47` (Tomato Red) |
| Primary shadow | `#B8382A` |
| Accent | `#FFCB47` (Sunny Yellow) |
| Accent shadow | `#D4A32E` |
| Secondary | `#4A90C4` (Sky Blue) |
| Secondary shadow | `#346A93` |
| Success | `#5AAD72` (Leaf Green) |
| Surface | `#FFFAF0` (Warm Cream) — page background |
| Card | `#FFFFFF` |
| Border | `#2A2A2A` (thick, 3px) |
| Muted border | `#E0D6C8` |
| Text | `#2A2A2A` |
| Text muted | `#888888` |
| Display font | Nunito 800/900 (Google Fonts) |
| Heading font | Nunito 700 |
| Body font | Nunito Sans 400/500/600 |
| Border radius: pill | `999px` (buttons, inputs, badges, tabs) |
| Border radius: card | `24px` |
| Border radius: photo | `16px` |
| Card shadow | `6px 6px 0 #2A2A2A` (hard offset) |
| Button shadow | `0 4px 0 {shade}` (pressed = `0 2px 0`) |
| Spacing scale | 4px base (4, 8, 12, 16, 20, 24, 32, 48) |

---

## Section 2: Component Library

### Restyled components (same API, new visuals)

**Button** — Pill shape, hard bottom shadow that shifts on `:active`. 4 variants:
- `primary`: Tomato Red (#E05A47), shadow #B8382A
- `secondary`: Sky Blue (#4A90C4), shadow #346A93
- `accent`: Sunny Yellow (#FFCB47), shadow #D4A32E, dark text
- `ghost`: Transparent background, red outline border
- GSAP squash on press: `scaleY: 0.92` → overshoot `1.05` → settle `1.0`

**Input** — Pill shape, 3px black border. Focus ring changes border to primary red with soft red glow. Code input variant: centered text, wide letter-spacing.

**Card** — 24px radius, 3px black border, hard offset shadow (`6px 6px 0 #2A2A2A`). Hover lifts slightly via GSAP (`translateY: -2px`, shadow grows to `8px 8px`). Sub-components (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) keep their existing API — only visual tokens change (font families, colors, spacing).

**Badge** — Pill shape, colored background tint + matching text color. Used for status indicators (uploads open, votes remaining, online count).

### New components

**TabSwitcher** — Pill-shaped container with 3px border. Active tab fills with primary color (white text), inactive tab is white (dark text). Used on home page for Create/Join toggle.

**Header** — White background, 3px bottom border. Contains: "DouDou" wordmark (Nunito 900, red "Dou" + gold "Dou") on left, session code badge in center (when in a session), profile on right.

**SessionCodeBadge** — Prominent pill badge displaying the session code in large tracked letters (Nunito 700, `letter-spacing: 4px`). Copy-on-click with bounce animation + brief accent yellow flash.

**ProgressBar** — Rounded bar with hard shadow aesthetic. Fills with primary color, elastic overshoot on completion, flashes green when done.

**StatusBanner** — Full-width rounded banner below header. Green tint for "voting open" (shows remaining votes), yellow tint for "voting closed" (links to results). Pill-shaped ends.

---

## Section 3: GSAP Animation System

All GSAP logic lives in `src/client/lib/animations.ts` as exported functions. Components call these functions — they never inline GSAP timelines.

### Micro-interactions (component-level)

**buttonPress(element)** — `scaleY: 0.92` → overshoot to `1.05` → settle `1.0`. Duration: 0.3s, ease: `elastic.out(1, 0.4)`. Triggered on mousedown/mouseup.

**cardHover(element, enter)** — Enter: `y: -4`, shadow grows from `6px 6px` to `8px 8px`. Duration: 0.2s, ease: `power2.out`. Leave: reverse.

**badgeAppear(element)** — `scale: 0` → overshoot `1.15` → `1.0`. Duration: 0.4s, ease: `back.out(2)`.

**voteStamp(element)** — Star icon does bouncy scale-up (`0` → `1.3` → `1.0`) with brief rotation wiggle (±10°). Duration: 0.5s.

**copyBounce(element)** — Badge bounces (`scale: 1.1` → `1.0`) and briefly flashes accent yellow background.

### Page transitions (route-level)

**pageEnter(element)** — `opacity: 0 → 1`, `y: 30 → 0`. Duration: 0.4s, ease: `power3.out`.

**pageExit(element)** — `opacity: 1 → 0`, `y: 0 → -20`. Duration: 0.25s, ease: `power2.in`.

Implementation: `<PageTransition>` wrapper component that runs GSAP timeline on mount/before-unmount via SolidJS `onMount`/`onCleanup`.

### Gallery animations

**staggerIn(elements)** — Each card: `y: 40 → 0`, `opacity: 0 → 1`, `scale: 0.9 → 1`. Stagger: 0.06s between cards. Ease: `back.out(1.5)`.

**itemAdded(element)** — New card pops in from `scale: 0` with bounce (`back.out(2)`).

**itemRemoved(element)** — Card shrinks to `scale: 0` and fades out, then grid reflows.

### Upload progress

**progressFill(element, percent)** — Bar fills with slight elastic overshoot at completion. On complete: bar flashes green briefly.

---

## Section 4: Page-by-Page Restyling

### Home page (Join/Create tabs)

- Warm cream (`#FFFAF0`) background
- Centered card with bold cartoon style (3px border, hard shadow)
- TabSwitcher at top toggling Create/Join views
- "DouDou" wordmark in header (Nunito 900, red + gold)
- Cards stagger-in on mount

### Sign-in page

- Centered card on cream background
- Email input: pill-shaped, 3px border
- OTP input: same style, wide letter-spacing, centered
- "Send Code" button: primary red pill
- "Use different email" link: ghost style
- Card enters with page transition (fade + slide up)

### Session board page

- Header: wordmark left, session code badge center (prominent, copy-on-click), profile right
- StatusBanner below header (green = voting open, yellow = voting closed)
- Owner dashboard: card with toggle buttons (pill-shaped, icon toggles 🔓/🔒)
- Image uploader: dashed border zone with rounded corners, drag state fills accent yellow tint
- Gallery: borderless photo cards in responsive grid, 16px rounded corners. Vote button overlays bottom-right on hover (always visible on mobile). Voted images get yellow star badge top-right.
- Lightbox: dark overlay, image centered, close button is a pill circle

### Results page

- Podium-style list: #1 gets gold (accent yellow) background tint + 🥇, #2 silver, #3 bronze
- Each result row: rounded card with photo thumbnail, filename, vote count
- Cards stagger-in from top to bottom
- Back button: ghost pill style

### ToS / Privacy pages

- Warm cream background, max-width prose container
- Headings in Nunito 700, body in Nunito Sans
- Clean reading experience, no special treatment

---

## Section 5: Tailwind Configuration & File Structure

### Tailwind theme extension

Added to `tailwind.config.ts`:
- **Colors:** `dd-primary`, `dd-primary-shadow`, `dd-accent`, `dd-accent-shadow`, `dd-secondary`, `dd-secondary-shadow`, `dd-success`, `dd-surface`, `dd-card`, `dd-border`, `dd-muted-border`, `dd-text`, `dd-text-muted`
- **Font families:** `display` → Nunito, `body` → Nunito Sans
- **Border radius:** `dd-pill` (999px), `dd-card` (24px), `dd-photo` (16px)
- **Box shadow:** `dd-card` (6px 6px 0 #2A2A2A), `dd-btn` (0 4px 0), `dd-btn-pressed` (0 2px 0)

### Google Fonts loading

Single `<link>` tag in `index.html` preloading:
- Nunito: weights 700, 800, 900
- Nunito Sans: weights 400, 500, 600
- `font-display: swap` for performance

### File structure changes

```
src/client/
  lib/
    animations.ts        ← NEW: GSAP preset functions
    api.ts               (unchanged)
    auth-client.ts       (unchanged)
    upload.ts            (unchanged)
    ws.ts                (unchanged)
  components/
    ui/
      Button.tsx          ← restyled (same API)
      Input.tsx           ← restyled (same API)
      Card.tsx            ← restyled (same API)
      Badge.tsx           ← NEW
      TabSwitcher.tsx     ← NEW
      ProgressBar.tsx     ← NEW
      StatusBanner.tsx    ← NEW
      SessionCodeBadge.tsx ← NEW
    PageTransition.tsx    ← NEW (route-level enter/exit)
    Header.tsx            ← NEW (extracted from __root.tsx)
    Profile.tsx           ← restyled
    CreateSession.tsx     ← restyled
    JoinSession.tsx       ← restyled
    Gallery.tsx           ← restyled
    ImageUploader.tsx     ← restyled
    VoteButton.tsx        ← restyled
    SessionDashboard.tsx  ← restyled
  routes/
    __root.tsx            ← updated (uses Header, PageTransition)
    index.tsx             ← restyled (uses TabSwitcher)
    sign-in.tsx           ← restyled
    sessions/$code.tsx    ← restyled (layout restructured for responsive)
    sessions/$code.results.tsx ← restyled
    tos.tsx               ← restyled
    policy.tsx            ← restyled
  styles/
    globals.css           ← updated (Toontown CSS variables, font imports)
```

---

## Section 6: Responsive Layout

### Breakpoints (Tailwind defaults)

- `sm`: 640px — phone landscape
- `md`: 768px — tablet
- `lg`: 1024px — desktop

### Layout by page

| Page | Mobile (<640px) | Tablet (768px) | Desktop (1024px+) |
|------|----------------|----------------|-------------------|
| Home | Full-width card, 16px padding | Centered max-w-sm | Same as tablet |
| Sign-in | Full-width card, 16px padding | Centered max-w-sm | Same as tablet |
| Session board | 2-col gallery, stacked layout | 3-col gallery, sidebar | 4-col gallery, sidebar |
| Results | Full-width rows | Centered max-w-2xl | Same as tablet |
| ToS/Policy | Full-width prose, 16px padding | Centered max-w-2xl | Same as tablet |

### Session board responsive detail

- **Mobile:** Status banner → uploader → dashboard (collapsible) → gallery (2 cols). All stacked vertically.
- **Tablet+:** Status banner full width. Below: left column = gallery (3-4 cols), right sidebar (~280px fixed) = dashboard + uploader.
- Gallery cards: `aspect-square` at all sizes.
- Vote button: always visible on mobile (touch targets), hover-reveal on desktop.

### Header responsive detail

- **Mobile:** Wordmark left, profile icon right. Session code badge on separate row below.
- **Tablet+:** Wordmark left, session code badge center, profile right — single row.

---

## Out of Scope

- Dark mode (light only)
- Illustrated characters or mascots
- New features or API changes
- Testing (covered in Sub-Project 1)
