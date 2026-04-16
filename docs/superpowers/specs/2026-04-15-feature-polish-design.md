# Sub-Project 3: Feature Polish — Specification

**Date:** 2026-04-15
**Depends on:** Sub-Projects 1 (Foundation) + 2 (UI/Design System) — complete
**Scope:** UX improvements and new features across 7 areas. Builds on existing Toontown design system.

---

## Data Model Changes

### New table: `rounds`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `session_id` | TEXT FK | → competition_sessions.id |
| `round_number` | INTEGER | 1-based |
| `status` | TEXT | `pending` \| `uploading` \| `voting` \| `closed` |
| `voting_started_at` | TEXT | ISO timestamp, nullable — set when voting starts |
| `created_at` | TEXT | ISO timestamp |

### Modified table: `competition_sessions`

New columns:
- `total_rounds` INTEGER DEFAULT 1 — set at creation, 1–10
- `current_round` INTEGER DEFAULT 1 — 1-based, tracks which round is active
- `voting_duration_minutes` INTEGER nullable — null = manual close, otherwise countdown timer
- `expires_at` TEXT — ISO timestamp, set to `created_at + 7 days`

### Modified tables: `session_images` and `votes`

New column on both:
- `round_id` TEXT FK → rounds.id

### Migration strategy

New migration file `0002_rounds.sql`:
1. Add columns to `competition_sessions`
2. Create `rounds` table
3. Add `round_id` to `session_images` and `votes`
4. Backfill: for each existing session, create a single round row and set `round_id` on existing images/votes

---

## Feature 1: Upload UX Polish

**Current:** Dashed border drop zone, single file, basic progress bar.

**Changes:**

- **Preview thumbnail:** After selecting/dropping a file, show an inline image preview (object-fit cover, 120px tall) with filename and file size. "Upload" and "Cancel" buttons below. Upload doesn't start until user confirms.
- **Webcam capture:** "Take Photo" button alongside "Choose File" in the drop zone. Opens an inline `<video>` element using `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`. Capture button snaps a frame to a hidden `<canvas>`, converts to JPEG blob, enters the preview → upload flow. Close button to dismiss camera.
- **HEIC conversion indicator:** If the file extension is `.heic`/`.heif` or MIME is `image/heic`, show a "Converting..." spinner state (existing `heic2any` library handles conversion). The preview shows after conversion completes.
- **Retry on failure:** If upload fails, show "Retry" and "Cancel" buttons instead of dismissing. The preview stays visible. Retry re-attempts with the same file.
- **GSAP animations:** Preview slides in with `pageEnter`-style animation. Progress bar uses existing `progressFill`. Success state: brief green flash + checkmark (`badgeAppear`-style bounce).
- **Single file only.** No multi-file support.

---

## Feature 2: Voting UX

**Current:** Star toggle button, remaining votes in text.

**Changes:**

- **Vote stamp animation:** Existing `voteStamp` GSAP animation on the VoteButton. Additionally, when a vote is cast, the star badge on the image card gets a brief golden pulse (scale 1 → 1.2 → 1.0, background flash to `dd-accent`).
- **Undo vote animation:** Removing a vote plays a reverse animation — star badge shrinks to 0 with a brief fade.
- **Remaining votes indicator:** Animated `Badge` component in the StatusBanner showing remaining vote count. When votes reach 0, the badge pulses `dd-primary` briefly. All unvoted images get a subtle desaturation CSS filter overlay (`filter: grayscale(50%) opacity(70%)`) to visually signal no more votes available.
- **Vote from lightbox:** The lightbox (Feature 6) includes the same `VoteButton` at the bottom center. Same animations. Vote state syncs via signals.
- **Anonymous voting:** Only the voter sees their own star badges on images. Vote counts are only visible on the results page. No change from current behavior.

---

## Feature 3: Session Management

### Session creation form

Extended with:
- `total_rounds`: Number input, default 1, min 1, max 10. Label: "Number of Rounds"
- `voting_duration_minutes`: Optional number input (null = manual). Options: null, 5, 10, 15, 30, 60 (dropdown or number input). Label: "Voting Timer (minutes)" with "No limit" as default.
- Existing `maxUploadsPerUser` and `maxVotesPerUser` apply per-round.

### My Sessions list

Below the Create/Join TabSwitcher on the home page:
- Section heading: "My Sessions" (only shows if user is signed in and has created sessions)
- Each row is a Card showing: session name, session code (small), current round status (e.g. "Round 2 of 3 — Voting"), created date
- Tap row → navigate to session board
- Fetched from `GET /api/sessions/mine` endpoint (returns sessions created by the authenticated user, ordered by `created_at DESC`, limit 10)

### Round advancement

The SessionDashboard (owner panel) shows round info:
- "Round {current} of {total}" heading
- Current round status badge (Uploading / Voting / Closed)
- Action buttons depending on state:
  - Uploading: "Close Uploads" → closes uploads for current round. "Start Voting" → transitions round to voting state.
  - Voting: "Close Voting" → manually closes voting (or auto-closes via timer). If timer is active, show countdown.
  - Closed: If not last round, "Next Round" → advances `current_round`, sets next round to `uploading`. If last round, "View Final Results" button.
- Toggle buttons for upload/voting open are removed — replaced by the round flow buttons above.

### Countdown timer

When `voting_duration_minutes` is set and voting starts for a round:
- `voting_started_at` is recorded on the round row
- StatusBanner shows a countdown: "Voting closes in 14:32"
- Countdown driven by client `setInterval` comparing `Date.now()` to `voting_started_at + duration`
- When countdown hits 0, the Durable Object auto-closes voting for that round. Implementation: use Durable Object alarm API — when voting starts, set an alarm for `voting_started_at + duration`. The alarm handler closes voting and broadcasts the update.
- Broadcasts `round-advanced` event so all clients update

### Session expiration

- `expires_at` column on `competition_sessions`, set to `created_at + 7 days`
- No active cleanup in this sub-project (that's Sub-Project 4). Just store the value for future use.

---

## Feature 4: QR Code Sharing

- **Library:** `qrcode` npm package (generates SVG/canvas QR codes client-side)
- **QR code URL:** `https://doudou.muniee.com/sessions/{CODE}` (or relative path `/sessions/{CODE}`)
- **Trigger locations:**
  - "Share" button in the SessionDashboard (owner panel)
  - "📋" icon on the SessionCodeBadge in the header (add a second "QR" icon next to it)
- **Dialog content:**
  - Large QR code SVG (256×256px), Toontown-styled (dd-primary colored modules on white)
  - Session code in big tracked letters below (reuses `SessionCodeBadge` styling)
  - "Share" button using `navigator.share()` (Web Share API) if available
  - "Copy Link" button as fallback (copies the full URL)
- **Animation:** QR code dialog uses existing Card. QR SVG does `badgeAppear`-style bounce on open. Dialog overlay fades in.

---

## Feature 5: Image Lightbox (Upgrade)

**Current:** Click image → dark overlay, full image, close button.

**Changes:**

- **Swipe navigation:** Left/right touch swipe or arrow key navigation between images. Swipe detection via pointer events (pointerdown → pointermove → pointerup). Threshold: 50px horizontal movement. On desktop, left/right arrow keys also work.
- **Image counter:** "3 / 12" displayed at top center of the lightbox.
- **Vote button:** `VoteButton` component at bottom center. Same animations. Vote state shared via signals with the gallery grid.
- **Image info:** Filename at top left. If user is session owner, "Remove" button at top right (deletes image, closes lightbox, removes from gallery with `itemRemoved` animation).
- **Close methods:** Click/tap outside image, press Escape, or tap close button (pill circle, top-right).
- **GSAP transitions:**
  - Open: image `scale: 0.9 → 1.0` + `opacity: 0 → 1` (0.3s)
  - Close: reverse
  - Navigate: current image fades out (`opacity: 0`, 0.15s), next image fades in (`opacity: 0 → 1`, 0.15s)
- **Component:** Extract lightbox into its own component `Lightbox.tsx` (currently inline in Gallery). Props: `images`, `currentIndex`, `onClose`, `onNavigate`, `votingOpen`, etc.

---

## Feature 6: Results & Celebration

### Per-round results

- TabSwitcher at top of results page: one tab per round ("Round 1", "Round 2", ...) plus "Overall" tab
- Each tab shows results for that round (images + vote counts, sorted descending)
- "Overall" tab aggregates vote counts across all rounds

### Winner reveal

On **first visit** to results page (tracked via `sessionStorage` key `results-revealed-{sessionId}`):

1. Dark overlay (#2A2A2A at 90% opacity), 0.5s pause
2. 3rd place: card slides in from left, bronze-tinted background (`dd-primary/10`), 0.4s
3. 2nd place: card slides in from right, silver-tinted background (`dd-secondary/10`), 0.4s
4. 1st place: card scales up from center, gold-tinted background (`dd-accent/20`), 0.5s
5. Confetti burst: canvas-based particle system
   - 100+ particles: gold (`dd-accent`) and red (`dd-primary`) circles and rectangles
   - Physics: gravity + slight horizontal drift, random initial velocity
   - Duration: ~2.5 seconds, particles fade out at end
   - Canvas overlay on top of results, removed after animation
6. After reveal, results page shows normally with all cards visible

**Subsequent visits:** Skip reveal, show results immediately with normal stagger-in animation.

### Shareable results card

- "Share Results" button below the results list
- Generates a styled HTML card (not a screenshot) containing:
  - Session name
  - Top 3 winners with thumbnail, rank, vote count
  - DouDou wordmark at bottom
- Share via `navigator.share()` (Web Share API) with title + text. If not available, "Copy Results" copies a text summary.

---

## Feature 7: Presence Indicators

### Durable Object changes

In `SessionRoom`:
- Maintain a `connectionCount` number (increment on WebSocket open, decrement on close)
- On count change, broadcast: `{ type: "presence-count", data: { count: N } }`
- Include current count in the initial state sent to newly connected clients

### Client display

- Add `WsEvent` type: `{ type: "presence-count"; data: { count: number } }`
- In the session board, maintain a `presenceCount` signal updated by WebSocket events
- Display: `Badge` component with `secondary` variant showing "👥 {count} online" — placed in the StatusBanner area (right side) on the session board page
- Animate count changes: brief `badgeAppear`-style bounce when count changes

### No user list

Just a connection count. No names, emails, or avatars.

---

## API Changes Summary

### New endpoints

- `GET /api/sessions/mine` — returns sessions created by authenticated user (limit 10, ordered by created_at DESC)
- `PUT /api/sessions/:id/rounds/:roundNumber/start-voting` — transitions round to voting state
- `PUT /api/sessions/:id/rounds/:roundNumber/close-voting` — manually closes voting for a round
- `PUT /api/sessions/:id/advance-round` — closes current round, opens next one for uploading
- `GET /api/sessions/:id/results?round=N` — results for a specific round (or all if `round=overall`)

### Modified endpoints

- `POST /api/sessions` — accepts `total_rounds` and `voting_duration_minutes`
- `POST /api/sessions/:id/images` — requires `round_id` (current round)
- `POST /api/sessions/:id/votes` — requires `round_id` (current round)
- `GET /api/sessions/:id/images` — accepts optional `?round=N` filter
- `GET /api/sessions/:id/votes/mine` — accepts optional `?round=N` filter
- `PUT /api/sessions/:id` — remove direct `uploadOpen`/`votingOpen` toggles (now managed via round flow)

### WebSocket events (additions)

- `presence-count`: `{ type: "presence-count", data: { count: number } }`
- `round-advanced`: `{ type: "round-advanced", data: { roundNumber: number, status: string } }`

---

## New Dependencies

- `qrcode` — client-side QR code generation (SVG output)
- No other new dependencies (confetti is custom canvas, webcam is native API, swipe is pointer events)

---

## File Structure Changes

```
src/client/
  components/
    ImageUploader.tsx        ← major rework (preview, webcam, retry)
    WebcamCapture.tsx        ← NEW: getUserMedia video + capture
    Gallery.tsx              ← extract lightbox, add desaturation logic
    Lightbox.tsx             ← NEW: extracted + swipe + vote + info
    VoteButton.tsx           ← add undo animation, golden pulse
    SessionDashboard.tsx     ← major rework (round flow, timer, QR trigger)
    CreateSession.tsx        ← add rounds + timer fields
    ConfettiCanvas.tsx       ← NEW: particle system for celebration
    QRShareDialog.tsx        ← NEW: QR code + share/copy
    MySessionsList.tsx       ← NEW: home page session list
    ui/
      (no new UI primitives — uses existing Badge, Card, TabSwitcher, etc.)
  lib/
    animations.ts            ← add: confettiReveal, lightboxOpen/Close, imageNavigate, voteUndo, goldenPulse, countdownPulse
    confetti.ts              ← NEW: canvas particle system logic
    swipe.ts                 ← NEW: pointer event swipe detection utility
    ws.ts                    ← add presence-count + round-advanced event handling
    api.ts                   ← add new endpoints
  routes/
    index.tsx                ← add MySessionsList below tabs
    sessions/$code.tsx       ← integrate presence badge, updated round-aware layout
    sessions/$code.results.tsx ← major rework (per-round tabs, reveal, confetti, share)

src/api/
  routes/
    sessions.ts              ← add /mine endpoint, round management endpoints
    images.ts                ← round_id awareness
    votes.ts                 ← round_id awareness
  (Durable Object)           ← presence count tracking, round timer alarms

src/shared/
  types.ts                   ← add Round types, presence event, update Session/Image/Vote types

migrations/
  0002_rounds.sql            ← schema migration
```

---

## Out of Scope

- Multi-file upload (single file only)
- User avatars or profile pictures
- Session cleanup/expiration enforcement (Sub-Project 4)
- Rate limiting (Sub-Project 4)
- Error tracking / monitoring (Sub-Project 4)
- Dark mode
