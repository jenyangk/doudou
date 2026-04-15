# DouDou Rewrite — Full Roadmap

**Date:** 2026-04-15

The DouDou photo competition app is being rewritten from Next.js/Supabase/Clerk to SolidJS/Cloudflare/Better Auth with a rubber-hose Disney art style. The work is decomposed into 4 sub-projects, each with its own spec → plan → implementation cycle.

---

## Sub-Project 1: Foundation (Stack, Infrastructure & Auth)

**Spec:** [2026-04-15-foundation-stack-design.md](specs/2026-04-15-foundation-stack-design.md)
**Status:** Spec complete

**Delivers:**
- SolidJS SPA with TanStack Router (no SSR)
- Hono API on a single Cloudflare Worker (serves SPA + API)
- D1 database: `competition_sessions`, `session_images`, `votes` tables
- R2 image storage with upload/serve pipeline
- Better Auth with passwordless email OTP
- Durable Objects `SessionRoom` for real-time WebSocket updates
- KV for session code lookup caching
- Basic functional UI (unstyled beyond Tailwind defaults)
- Dev environment: Vite + wrangler dev with miniflare
- API integration tests (Vitest + miniflare), component unit tests

**Key decisions:**
- All-in-one Worker (SPA + API in one deploy target)
- Single package with folder separation (`src/api`, `src/client`, `src/shared`)
- GSAP for animations (wired up, full use in Sub-Project 2)
- 10MB max image upload, client-side HEIC→JPEG conversion

---

## Sub-Project 2: UI/Design System

**Spec:** TBD
**Status:** Not started
**Depends on:** Sub-Project 1

**Delivers:**
- Rubber-hose / early Disney art style design system
- Custom color palette: warm, saturated tones inspired by 1920s–1930s animation cels
- Typography: display + body font pairing that evokes vintage cartoon title cards
- Custom component library (buttons, cards, inputs, modals) with rubber-hose visual treatment
- GSAP character-style animations: squash-and-stretch transitions, bouncy easing curves, wobbly hover states
- Page transition system: playful enter/exit animations between routes
- Gallery card design with vote interaction animations
- Responsive layout system
- Dark/light theme support (if applicable to the art style)

**Open questions (to resolve during spec):**
- How literal is the rubber-hose style? Full illustrated characters, or just the motion/shape language applied to UI elements?
- Color palette: muted vintage or bright modern interpretation?
- Should the app have illustrated mascot characters?

---

## Sub-Project 3: Feature Polish

**Spec:** TBD
**Status:** Not started
**Depends on:** Sub-Projects 1 & 2

**Delivers:**
- **Upload UX:** Polished drag-and-drop with animated preview thumbnails, per-file progress, retry on failure, multi-file support, webcam capture option
- **Voting UX:** Satisfying vote interaction (animated rubber-hose trophy/stamp), clear remaining-votes indicator, undo vote with animation
- **Session management:** Session list for creators (past sessions), session settings panel, session expiration/cleanup
- **QR code sharing:** Styled QR code generation for session join codes, share sheet
- **Results/Leaderboard:** Animated reveal of winners, confetti/celebration effects, podium display with rubber-hose style, shareable results card
- **Image lightbox:** Full-screen image viewer with swipe navigation, vote from lightbox
- **Presence indicators:** Show who's online in a session (connected via Durable Objects)

**Open questions (to resolve during spec):**
- Should session creators be able to add rounds/categories?
- Time-limited sessions (auto-close voting after X minutes)?
- Anonymous vs attributed voting?

---

## Sub-Project 4: Ops & Growth

**Spec:** TBD
**Status:** Not started
**Depends on:** Sub-Projects 1–3

**Delivers:**
- **Rate limiting:** KV-based rate limiting on API routes (upload, vote, session creation)
- **Email templates:** Styled OTP email with rubber-hose branding
- **Error tracking:** Sentry or equivalent for Worker + client error reporting
- **Monitoring:** Cloudflare Analytics + custom metrics (sessions created, images uploaded, votes cast)
- **Performance:** Image optimization (R2 → CF Image Resizing for thumbnails), lazy loading, bundle optimization
- **Production hardening:** CORS config, CSP headers, input sanitization audit, abuse prevention
- **SEO/Sharing:** Open Graph images for shared session links, meta tags for public pages
- **Cleanup:** Scheduled Worker (Cron Trigger) for expired session cleanup, orphaned R2 object removal

**Open questions (to resolve during spec):**
- Custom domain setup and DNS?
- Need for user-facing analytics (session creator sees engagement stats)?
- Notification system (email when someone uploads to your session)?

---

## Dependency Graph

```
Sub-Project 1: Foundation
        │
        ├──► Sub-Project 2: UI/Design System
        │            │
        │            ▼
        ├──► Sub-Project 3: Feature Polish
        │            │
        │            ▼
        └──► Sub-Project 4: Ops & Growth
```

Sub-Projects 2 and 3 are sequential (3 needs 2's design system). Sub-Project 4 can begin partially in parallel with 3 (rate limiting, error tracking don't depend on feature polish) but is ordered last for simplicity.

---

## Timeline Notes

Each sub-project follows: **spec → implementation plan → build → review**. No time estimates — pace depends on complexity discovered during planning. Sub-Project 1 is the largest foundational lift; Sub-Projects 2–4 are incremental on top of it.
