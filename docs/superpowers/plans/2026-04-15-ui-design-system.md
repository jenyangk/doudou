# UI/Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the entire DouDou SPA with a rubber-hose cartoon design system — Toontown palette, pill shapes, hard drop shadows, bouncy GSAP animations, and full route transitions.

**Architecture:** Tailwind theme tokens define the design system. All GSAP logic is centralized in `animations.ts`. Components keep their existing APIs — only visuals change. New components (Badge, TabSwitcher, etc.) are pure UI primitives.

**Tech Stack:** SolidJS, TailwindCSS 3.4, GSAP 3.12, Google Fonts (Nunito + Nunito Sans), TanStack Solid Router

**Spec:** `docs/superpowers/specs/2026-04-15-ui-design-system.md`

**Note:** `tailwind.config.ts` currently has duplicated content (the entire config appears twice). Task 1 replaces the whole file with the corrected + themed version.

---

### Task 1: Design Foundation — Tailwind Config, CSS Variables, Google Fonts

**Files:**
- Modify: `tailwind.config.ts` (replace entirely — currently has duplicated content)
- Modify: `src/client/styles/globals.css`
- Modify: `index.html`

- [ ] **Step 1: Replace `tailwind.config.ts` with themed version**

Replace the entire file content (it currently contains a duplicate export) with:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dd: {
          primary: "#E05A47",
          "primary-shadow": "#B8382A",
          accent: "#FFCB47",
          "accent-shadow": "#D4A32E",
          secondary: "#4A90C4",
          "secondary-shadow": "#346A93",
          success: "#5AAD72",
          surface: "#FFFAF0",
          card: "#FFFFFF",
          border: "#2A2A2A",
          "muted-border": "#E0D6C8",
          text: "#2A2A2A",
          "text-muted": "#888888",
        },
      },
      fontFamily: {
        display: ["Nunito", "system-ui", "sans-serif"],
        body: ["Nunito Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "dd-pill": "999px",
        "dd-card": "24px",
        "dd-photo": "16px",
      },
      boxShadow: {
        "dd-card": "6px 6px 0 #2A2A2A",
        "dd-card-hover": "8px 8px 0 #2A2A2A",
        "dd-btn-primary": "0 4px 0 #B8382A",
        "dd-btn-primary-pressed": "0 2px 0 #B8382A",
        "dd-btn-secondary": "0 4px 0 #346A93",
        "dd-btn-secondary-pressed": "0 2px 0 #346A93",
        "dd-btn-accent": "0 4px 0 #D4A32E",
        "dd-btn-accent-pressed": "0 2px 0 #D4A32E",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: Replace `src/client/styles/globals.css`**

Replace the entire file content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: "Nunito Sans", system-ui, sans-serif;
    background-color: #FFFAF0;
    color: #2A2A2A;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: "Nunito", system-ui, sans-serif;
  }
}
```

- [ ] **Step 3: Add Google Fonts `<link>` to `index.html`**

Add font preconnect and stylesheet links in the `<head>`, before the `<title>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/client/styles/globals.css index.html
git commit -m "feat(ui): add Toontown design tokens, Google Fonts, CSS foundation"
```

---

### Task 2: GSAP Animation Library

**Files:**
- Create: `src/client/lib/animations.ts`

- [ ] **Step 1: Create `src/client/lib/animations.ts`**

```ts
import gsap from "gsap";

// --- Micro-interactions ---

export function buttonPress(el: HTMLElement) {
  gsap.timeline()
    .to(el, { scaleY: 0.92, duration: 0.08, ease: "power2.in" })
    .to(el, { scaleY: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" });
}

export function cardHover(el: HTMLElement, enter: boolean) {
  gsap.to(el, {
    y: enter ? -4 : 0,
    boxShadow: enter ? "8px 8px 0 #2A2A2A" : "6px 6px 0 #2A2A2A",
    duration: 0.2,
    ease: "power2.out",
  });
}

export function badgeAppear(el: HTMLElement) {
  gsap.fromTo(el, { scale: 0 }, {
    scale: 1,
    duration: 0.4,
    ease: "back.out(2)",
  });
}

export function voteStamp(el: HTMLElement) {
  gsap.timeline()
    .fromTo(el, { scale: 0, rotation: -10 }, {
      scale: 1.3,
      rotation: 10,
      duration: 0.25,
      ease: "power2.out",
    })
    .to(el, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: "elastic.out(1, 0.5)",
    });
}

export function copyBounce(el: HTMLElement) {
  const original = getComputedStyle(el).backgroundColor;
  gsap.timeline()
    .to(el, { scale: 1.1, backgroundColor: "#FFCB47", duration: 0.15 })
    .to(el, { scale: 1, backgroundColor: original, duration: 0.3, ease: "elastic.out(1, 0.4)" });
}

// --- Page transitions ---

export function pageEnter(el: HTMLElement) {
  return gsap.fromTo(el,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
  );
}

export function pageExit(el: HTMLElement) {
  return gsap.to(el, {
    opacity: 0,
    y: -20,
    duration: 0.25,
    ease: "power2.in",
  });
}

// --- Gallery animations ---

export function staggerIn(elements: HTMLElement[]) {
  gsap.fromTo(elements,
    { y: 40, opacity: 0, scale: 0.9 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      stagger: 0.06,
      duration: 0.5,
      ease: "back.out(1.5)",
    }
  );
}

export function itemAdded(el: HTMLElement) {
  gsap.fromTo(el, { scale: 0 }, {
    scale: 1,
    duration: 0.4,
    ease: "back.out(2)",
  });
}

export function itemRemoved(el: HTMLElement) {
  return gsap.to(el, {
    scale: 0,
    opacity: 0,
    duration: 0.25,
    ease: "power2.in",
  });
}

// --- Upload progress ---

export function progressFill(el: HTMLElement, percent: number) {
  const isComplete = percent >= 100;
  gsap.to(el, {
    width: `${percent}%`,
    duration: 0.3,
    ease: isComplete ? "elastic.out(1, 0.5)" : "power2.out",
    onComplete: isComplete ? () => {
      gsap.to(el, { backgroundColor: "#5AAD72", duration: 0.2 });
      gsap.to(el, { backgroundColor: "#E05A47", duration: 0.3, delay: 0.5 });
    } : undefined,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/lib/animations.ts
git commit -m "feat(ui): add GSAP animation preset library"
```

---

### Task 3: Restyle Button Component

**Files:**
- Modify: `src/client/components/ui/Button.tsx`

- [ ] **Step 1: Replace Button with Toontown styling**

Replace the entire file content with:

```tsx
import { splitProps, type JSX } from "solid-js";
import { buttonPress } from "../../lib/animations";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const variants: Record<string, string> = {
  primary:
    "bg-dd-primary text-white shadow-dd-btn-primary active:shadow-dd-btn-primary-pressed active:translate-y-[2px]",
  secondary:
    "bg-dd-secondary text-white shadow-dd-btn-secondary active:shadow-dd-btn-secondary-pressed active:translate-y-[2px]",
  accent:
    "bg-dd-accent text-dd-text shadow-dd-btn-accent active:shadow-dd-btn-accent-pressed active:translate-y-[2px]",
  ghost:
    "bg-transparent text-dd-primary border-3 border-dd-primary hover:bg-dd-primary/10",
};

const sizes: Record<string, string> = {
  default: "h-11 px-6 py-2 text-base",
  sm: "h-9 px-4 text-sm",
  lg: "h-13 px-8 text-lg",
  icon: "h-11 w-11",
};

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children", "onClick"]);

  const classes = () =>
    `inline-flex items-center justify-center rounded-dd-pill font-display font-bold
     transition-all duration-150
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dd-primary focus-visible:ring-offset-2
     disabled:opacity-50 disabled:pointer-events-none
     ${variants[local.variant ?? "primary"]}
     ${sizes[local.size ?? "default"]}
     ${local.class ?? ""}`.trim();

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (e) => {
    buttonPress(e.currentTarget);
    if (typeof local.onClick === "function") {
      local.onClick(e);
    }
  };

  return (
    <button class={classes()} onClick={handleClick} {...rest}>
      {local.children}
    </button>
  );
}
```

**Migration note for call sites:** The default variant changed from `"default"` to `"primary"`. Existing call sites that used `variant="default"` or no variant will now get the red primary style (desired). `variant="outline"` call sites must be changed to `variant="ghost"`. `variant="destructive"` call sites must be changed to `variant="primary"`. Here are the exact call site changes needed (do them in this step):

In `src/client/components/SessionDashboard.tsx`, change both `variant="outline"` to `variant="ghost"`:
- Line: `<Button size="sm" variant="outline" onClick={toggleUploads}>` → `<Button size="sm" variant="ghost" onClick={toggleUploads}>`
- Line: `<Button size="sm" variant="outline" onClick={toggleVoting}>` → `<Button size="sm" variant="ghost" onClick={toggleVoting}>`

In `src/client/components/ImageUploader.tsx`, change `variant="outline"` to `variant="ghost"`:
- Line: `<Button variant="outline" size="sm" onClick={() => fileInput.click()}>` → `<Button variant="ghost" size="sm" onClick={() => fileInput.click()}>`

- [ ] **Step 2: Commit**

```bash
git add src/client/components/ui/Button.tsx src/client/components/SessionDashboard.tsx src/client/components/ImageUploader.tsx
git commit -m "feat(ui): restyle Button with Toontown pill shape and GSAP press"
```

---

### Task 4: Restyle Input Component

**Files:**
- Modify: `src/client/components/ui/Input.tsx`

- [ ] **Step 1: Replace Input with Toontown styling**

Replace the entire file content with:

```tsx
import { splitProps, type JSX } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <input
      class={`flex h-11 w-full rounded-dd-pill border-3 border-dd-border bg-white px-4 py-2
              font-body text-base text-dd-text
              placeholder:text-dd-text-muted
              focus-visible:outline-none focus-visible:border-dd-primary focus-visible:ring-2 focus-visible:ring-dd-primary/20
              disabled:opacity-50 ${local.class ?? ""}`}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/ui/Input.tsx
git commit -m "feat(ui): restyle Input with pill shape and bold border"
```

---

### Task 5: Restyle Card Component

**Files:**
- Modify: `src/client/components/ui/Card.tsx`

- [ ] **Step 1: Replace Card with Toontown styling**

Replace the entire file content with:

```tsx
import type { JSX } from "solid-js";

interface CardProps {
  class?: string;
  children: JSX.Element;
}

export function Card(props: CardProps) {
  return (
    <div class={`rounded-dd-card border-3 border-dd-border bg-dd-card shadow-dd-card ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardHeader(props: CardProps) {
  return (
    <div class={`flex flex-col space-y-1.5 p-6 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardTitle(props: CardProps) {
  return (
    <h3 class={`text-xl font-display font-bold leading-none tracking-tight text-dd-text ${props.class ?? ""}`}>
      {props.children}
    </h3>
  );
}

export function CardDescription(props: CardProps) {
  return (
    <p class={`text-sm font-body text-dd-text-muted ${props.class ?? ""}`}>
      {props.children}
    </p>
  );
}

export function CardContent(props: CardProps) {
  return (
    <div class={`p-6 pt-0 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardFooter(props: CardProps) {
  return (
    <div class={`flex items-center p-6 pt-0 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/ui/Card.tsx
git commit -m "feat(ui): restyle Card with cartoon borders and hard drop shadow"
```

---

### Task 6: New UI Components — Badge, TabSwitcher, ProgressBar

**Files:**
- Create: `src/client/components/ui/Badge.tsx`
- Create: `src/client/components/ui/TabSwitcher.tsx`
- Create: `src/client/components/ui/ProgressBar.tsx`

- [ ] **Step 1: Create Badge component**

Create `src/client/components/ui/Badge.tsx`:

```tsx
import { onMount, type JSX } from "solid-js";
import { badgeAppear } from "../../lib/animations";

interface BadgeProps {
  variant?: "primary" | "accent" | "secondary" | "success";
  class?: string;
  animate?: boolean;
  children: JSX.Element;
}

const variants: Record<string, string> = {
  primary: "bg-dd-primary/15 text-dd-primary",
  accent: "bg-dd-accent/25 text-dd-accent-shadow",
  secondary: "bg-dd-secondary/15 text-dd-secondary",
  success: "bg-dd-success/15 text-dd-success",
};

export function Badge(props: BadgeProps) {
  let ref!: HTMLSpanElement;

  onMount(() => {
    if (props.animate) badgeAppear(ref);
  });

  return (
    <span
      ref={ref}
      class={`inline-flex items-center rounded-dd-pill px-3 py-1 text-sm font-display font-bold
              ${variants[props.variant ?? "primary"]}
              ${props.class ?? ""}`}
    >
      {props.children}
    </span>
  );
}
```

- [ ] **Step 2: Create TabSwitcher component**

Create `src/client/components/ui/TabSwitcher.tsx`:

```tsx
import { For, type JSX } from "solid-js";
import { buttonPress } from "../../lib/animations";

interface Tab {
  key: string;
  label: string;
}

interface TabSwitcherProps {
  tabs: Tab[];
  active: string;
  onTabChange: (key: string) => void;
  class?: string;
}

export function TabSwitcher(props: TabSwitcherProps) {
  const handleClick = (key: string, e: MouseEvent) => {
    buttonPress(e.currentTarget as HTMLElement);
    props.onTabChange(key);
  };

  return (
    <div class={`inline-flex rounded-dd-pill border-3 border-dd-border overflow-hidden ${props.class ?? ""}`}>
      <For each={props.tabs}>
        {(tab) => (
          <button
            class={`px-6 py-2.5 text-sm font-display font-bold transition-colors
                    ${props.active === tab.key
                      ? "bg-dd-primary text-white"
                      : "bg-white text-dd-text hover:bg-dd-surface"
                    }`}
            onClick={(e) => handleClick(tab.key, e)}
          >
            {tab.label}
          </button>
        )}
      </For>
    </div>
  );
}
```

- [ ] **Step 3: Create ProgressBar component**

Create `src/client/components/ui/ProgressBar.tsx`:

```tsx
import { createEffect, on } from "solid-js";
import { progressFill } from "../../lib/animations";

interface ProgressBarProps {
  percent: number;
  class?: string;
}

export function ProgressBar(props: ProgressBarProps) {
  let fillRef!: HTMLDivElement;

  createEffect(on(() => props.percent, (pct) => {
    if (fillRef) progressFill(fillRef, pct);
  }));

  return (
    <div class={`w-full h-3 rounded-dd-pill border-2 border-dd-border bg-white overflow-hidden ${props.class ?? ""}`}>
      <div
        ref={fillRef}
        class="h-full bg-dd-primary rounded-dd-pill"
        style={{ width: "0%" }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/client/components/ui/Badge.tsx src/client/components/ui/TabSwitcher.tsx src/client/components/ui/ProgressBar.tsx
git commit -m "feat(ui): add Badge, TabSwitcher, ProgressBar components"
```

---

### Task 7: New Components — StatusBanner, SessionCodeBadge

**Files:**
- Create: `src/client/components/ui/StatusBanner.tsx`
- Create: `src/client/components/ui/SessionCodeBadge.tsx`

- [ ] **Step 1: Create StatusBanner component**

Create `src/client/components/ui/StatusBanner.tsx`:

```tsx
import type { JSX } from "solid-js";

interface StatusBannerProps {
  variant: "success" | "warning";
  class?: string;
  children: JSX.Element;
}

const variants: Record<string, string> = {
  success: "bg-dd-success/15 text-dd-success border-dd-success/30",
  warning: "bg-dd-accent/20 text-dd-accent-shadow border-dd-accent-shadow/30",
};

export function StatusBanner(props: StatusBannerProps) {
  return (
    <div
      class={`w-full rounded-dd-pill border-2 px-5 py-2.5 text-center text-sm font-display font-bold
              ${variants[props.variant]}
              ${props.class ?? ""}`}
    >
      {props.children}
    </div>
  );
}
```

- [ ] **Step 2: Create SessionCodeBadge component**

Create `src/client/components/ui/SessionCodeBadge.tsx`:

```tsx
import { copyBounce } from "../../lib/animations";
import toast from "solid-toast";

interface SessionCodeBadgeProps {
  code: string;
  class?: string;
}

export function SessionCodeBadge(props: SessionCodeBadgeProps) {
  let ref!: HTMLButtonElement;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.code);
      copyBounce(ref);
      toast.success("Code copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      ref={ref}
      onClick={handleCopy}
      class={`inline-flex items-center gap-2 rounded-dd-pill border-3 border-dd-border bg-white
              px-5 py-1.5 font-display font-bold text-lg tracking-[4px] text-dd-text
              hover:bg-dd-surface transition-colors cursor-pointer
              ${props.class ?? ""}`}
      title="Click to copy session code"
    >
      {props.code}
      <span class="text-sm tracking-normal text-dd-text-muted">📋</span>
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/ui/StatusBanner.tsx src/client/components/ui/SessionCodeBadge.tsx
git commit -m "feat(ui): add StatusBanner and SessionCodeBadge components"
```

---

### Task 8: Header Component + PageTransition Wrapper

**Files:**
- Create: `src/client/components/Header.tsx`
- Create: `src/client/components/PageTransition.tsx`

- [ ] **Step 1: Create Header component**

Create `src/client/components/Header.tsx`:

```tsx
import { Show } from "solid-js";
import { Link } from "@tanstack/solid-router";
import { Profile } from "./Profile";
import { SessionCodeBadge } from "./ui/SessionCodeBadge";

interface HeaderProps {
  sessionCode?: string;
}

export function Header(props: HeaderProps) {
  return (
    <header class="sticky top-0 z-50 border-b-3 border-dd-border bg-white">
      {/* Mobile: wordmark + profile top row */}
      <div class="flex h-14 items-center justify-between px-4 md:px-6">
        <Link to="/" class="hover:opacity-80">
          <span class="font-display text-xl font-black">
            <span class="text-dd-primary">Dou</span>
            <span class="text-dd-accent">Dou</span>
          </span>
        </Link>

        {/* Session code badge — center on tablet+ */}
        <Show when={props.sessionCode}>
          <div class="hidden md:block">
            <SessionCodeBadge code={props.sessionCode!} />
          </div>
        </Show>

        <Profile />
      </div>

      {/* Mobile: session code on second row */}
      <Show when={props.sessionCode}>
        <div class="flex justify-center pb-2 md:hidden">
          <SessionCodeBadge code={props.sessionCode!} />
        </div>
      </Show>
    </header>
  );
}
```

- [ ] **Step 2: Create PageTransition component**

Create `src/client/components/PageTransition.tsx`:

```tsx
import { onMount, type JSX } from "solid-js";
import { pageEnter } from "../lib/animations";

interface PageTransitionProps {
  children: JSX.Element;
}

export function PageTransition(props: PageTransitionProps) {
  let ref!: HTMLDivElement;

  onMount(() => {
    pageEnter(ref);
  });

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {props.children}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/Header.tsx src/client/components/PageTransition.tsx
git commit -m "feat(ui): add Header component and PageTransition wrapper"
```

---

### Task 9: Update Root Layout

**Files:**
- Modify: `src/client/routes/__root.tsx`

- [ ] **Step 1: Replace root layout with Header and themed footer**

Replace the entire file content with:

```tsx
import { Outlet, Link, useParams } from "@tanstack/solid-router";
import { Toaster } from "solid-toast";
import { Header } from "../components/Header";

export function RootLayout() {
  // Try to get session code from URL params if on a session page
  let sessionCode: string | undefined;
  try {
    const params = useParams({ strict: false });
    sessionCode = params.code;
  } catch {
    // Not on a session route — no code
  }

  return (
    <div class="flex flex-col min-h-screen bg-dd-surface">
      <Header sessionCode={sessionCode} />

      <main class="flex-1">
        <Outlet />
      </main>

      <footer class="border-t-2 border-dd-muted-border py-4 px-4 md:px-6 bg-white">
        <div class="max-w-sm mx-auto flex justify-center gap-4 text-sm font-body text-dd-text-muted">
          <Link to="/tos" class="hover:text-dd-primary transition-colors">
            Terms of Service
          </Link>
          <Link to="/policy" class="hover:text-dd-primary transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>

      <Toaster position="bottom-center" />
    </div>
  );
}
```

**Note:** The `useParams` in root layout is a best-effort approach. If TanStack Solid Router does not support `useParams({ strict: false })` at root level, wrap it in a try/catch (shown above). Alternatively, the session code can be passed via route context — adjust if needed at implementation time.

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/__root.tsx
git commit -m "feat(ui): update root layout with Header and Toontown footer"
```

---

### Task 10: Restyle Profile Component

**Files:**
- Modify: `src/client/components/Profile.tsx`

- [ ] **Step 1: Restyle Profile with Toontown classes**

Replace the entire file content with:

```tsx
import { Show } from "solid-js";
import { useSession, signOut } from "../lib/auth-client";
import { Button } from "./ui/Button";
import { useNavigate } from "@tanstack/solid-router";

export function Profile() {
  const session = useSession();
  const navigate = useNavigate();

  return (
    <Show
      when={session()?.data?.user}
      fallback={
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/sign-in" })}>
          Sign In
        </Button>
      }
    >
      {(user) => (
        <div class="flex items-center gap-2">
          <span class="text-sm font-body font-medium text-dd-text-muted hidden sm:inline">
            {user().email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
          >
            Sign Out
          </Button>
        </div>
      )}
    </Show>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/Profile.tsx
git commit -m "feat(ui): restyle Profile with Toontown typography"
```

---

### Task 11: Restyle Home Page with TabSwitcher

**Files:**
- Modify: `src/client/routes/index.tsx`

- [ ] **Step 1: Replace home page with Toontown styling and TabSwitcher**

Replace the entire file content with:

```tsx
import { createSignal } from "solid-js";
import { CreateSession } from "../components/CreateSession";
import { JoinSession } from "../components/JoinSession";
import { TabSwitcher } from "../components/ui/TabSwitcher";
import { PageTransition } from "../components/PageTransition";

export default function Home() {
  const [tab, setTab] = createSignal<string>("join");

  return (
    <PageTransition>
      <div class="py-8 max-w-sm mx-auto px-4">
        <TabSwitcher
          tabs={[
            { key: "create", label: "Create Session" },
            { key: "join", label: "Join Session" },
          ]}
          active={tab()}
          onTabChange={setTab}
          class="w-full mb-6"
        />

        {tab() === "create" ? <CreateSession /> : <JoinSession />}
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/index.tsx
git commit -m "feat(ui): restyle home page with TabSwitcher"
```

---

### Task 12: Restyle CreateSession and JoinSession

**Files:**
- Modify: `src/client/components/CreateSession.tsx`
- Modify: `src/client/components/JoinSession.tsx`

- [ ] **Step 1: Restyle CreateSession**

Replace the entire file content with:

```tsx
import { createSignal, Show } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { useSession } from "../lib/auth-client";
import { createSession } from "../lib/api";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/Card";
import toast from "solid-toast";

export function CreateSession() {
  const session = useSession();
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [maxUploads, setMaxUploads] = createSignal(1);
  const [maxVotes, setMaxVotes] = createSignal(3);
  const [loading, setLoading] = createSignal(false);

  const isSignedIn = () => !!session()?.data?.user;

  const handleCreate = async () => {
    if (!name()) {
      toast.error("Please enter a session name");
      return;
    }

    setLoading(true);
    try {
      const result = await createSession({
        name: name(),
        maxUploadsPerUser: maxUploads(),
        maxVotesPerUser: maxVotes(),
      });
      toast.success("Session created!");
      navigate({ to: "/sessions/$code", params: { code: result.code } });
    } catch (err: any) {
      toast.error(err.error ?? "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Session</CardTitle>
        <CardDescription>Start a new photo competition</CardDescription>
      </CardHeader>
      <Show
        when={isSignedIn()}
        fallback={
          <CardContent>
            <p class="text-sm font-body text-dd-text-muted">Please sign in to create sessions.</p>
          </CardContent>
        }
      >
        <CardContent class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-display font-bold text-dd-text" for="session-name">Session Name</label>
            <Input
              id="session-name"
              placeholder="My Competition"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-display font-bold text-dd-text" for="max-uploads">Max Uploads Per User</label>
            <Input
              id="max-uploads"
              type="number"
              min={1}
              max={20}
              value={maxUploads()}
              onInput={(e) => setMaxUploads(parseInt(e.currentTarget.value) || 1)}
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-display font-bold text-dd-text" for="max-votes">Max Votes Per User</label>
            <Input
              id="max-votes"
              type="number"
              min={1}
              max={50}
              value={maxVotes()}
              onInput={(e) => setMaxVotes(parseInt(e.currentTarget.value) || 3)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="w-full" onClick={handleCreate} disabled={loading()}>
            {loading() ? "Creating..." : "Create"}
          </Button>
        </CardFooter>
      </Show>
    </Card>
  );
}
```

- [ ] **Step 2: Restyle JoinSession**

Replace the entire file content with:

```tsx
import { createSignal } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import toast from "solid-toast";

export function JoinSession() {
  const navigate = useNavigate();
  const [code, setCode] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleJoin = (e: Event) => {
    e.preventDefault();
    const trimmed = code().trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a session code");
      return;
    }
    setLoading(true);
    navigate({ to: "/sessions/$code", params: { code: trimmed } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Session</CardTitle>
        <CardDescription>Enter a session code to join</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} class="space-y-4">
          <Input
            type="text"
            placeholder="SESSION CODE"
            value={code()}
            onInput={(e) => setCode(e.currentTarget.value)}
            class="text-center text-lg uppercase tracking-[4px] font-display font-bold"
            maxLength={6}
            required
          />
          <Button type="submit" class="w-full" disabled={loading()}>
            {loading() ? "Joining..." : "Join Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/CreateSession.tsx src/client/components/JoinSession.tsx
git commit -m "feat(ui): restyle CreateSession and JoinSession forms"
```

---

### Task 13: Restyle Sign-In Page

**Files:**
- Modify: `src/client/routes/sign-in.tsx`

- [ ] **Step 1: Restyle sign-in with PageTransition and Toontown classes**

Replace the entire file content with:

```tsx
import { createSignal, Show } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { authClient, useSession } from "../lib/auth-client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { PageTransition } from "../components/PageTransition";
import toast from "solid-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const session = useSession();

  if (session()?.data?.user) {
    navigate({ to: "/" });
  }

  const [email, setEmail] = createSignal("");
  const [otp, setOtp] = createSignal("");
  const [step, setStep] = createSignal<"email" | "otp">("email");
  const [loading, setLoading] = createSignal(false);

  const sendOtp = async (e: Event) => {
    e.preventDefault();
    if (!email()) return;

    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: email() });
      setStep("otp");
      toast.success("Check your email for the verification code");
    } catch (err) {
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: Event) => {
    e.preventDefault();
    if (!otp()) return;

    setLoading(true);
    try {
      await authClient.signIn.emailOtp({ email: email(), otp: otp() });
      toast.success("Signed in successfully");
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div class="flex items-center justify-center min-h-[80vh] px-4">
        <Card class="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email to receive a verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Show
              when={step() === "otp"}
              fallback={
                <form onSubmit={sendOtp} class="space-y-4">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email()}
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    required
                  />
                  <Button type="submit" class="w-full" disabled={loading()}>
                    {loading() ? "Sending..." : "Send Code"}
                  </Button>
                </form>
              }
            >
              <form onSubmit={verifyOtp} class="space-y-4">
                <p class="text-sm font-body text-dd-text-muted">
                  Code sent to <strong class="text-dd-text">{email()}</strong>
                </p>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp()}
                  onInput={(e) => setOtp(e.currentTarget.value)}
                  maxLength={6}
                  class="text-center text-lg tracking-[4px] font-display font-bold"
                  required
                />
                <Button type="submit" class="w-full" disabled={loading()}>
                  {loading() ? "Verifying..." : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  class="w-full"
                  onClick={() => setStep("email")}
                >
                  Use a different email
                </Button>
              </form>
            </Show>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/sign-in.tsx
git commit -m "feat(ui): restyle sign-in page with Toontown design"
```

---

### Task 14: Restyle VoteButton and ImageUploader

**Files:**
- Modify: `src/client/components/VoteButton.tsx`
- Modify: `src/client/components/ImageUploader.tsx`

- [ ] **Step 1: Restyle VoteButton with stamp animation**

Replace the entire file content with:

```tsx
import { Button } from "./ui/Button";
import { castVote, removeVote } from "../lib/api";
import { voteStamp } from "../lib/animations";
import toast from "solid-toast";

interface VoteButtonProps {
  sessionId: string;
  imageId: string;
  voted: boolean;
  disabled: boolean;
  onVoteChange?: () => void;
}

export function VoteButton(props: VoteButtonProps) {
  let ref!: HTMLDivElement;

  const handleClick = async () => {
    try {
      if (props.voted) {
        await removeVote(props.sessionId, props.imageId);
      } else {
        await castVote(props.sessionId, { imageId: props.imageId });
        if (ref) voteStamp(ref);
      }
      props.onVoteChange?.();
    } catch (err: any) {
      toast.error(err.error ?? "Vote failed");
    }
  };

  return (
    <div ref={ref} class="inline-block">
      <Button
        size="sm"
        variant={props.voted ? "accent" : "primary"}
        disabled={props.disabled && !props.voted}
        onClick={handleClick}
      >
        {props.voted ? "★ Voted" : "☆ Vote"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Restyle ImageUploader with Toontown drop zone and ProgressBar**

Replace the entire file content with:

```tsx
import { createSignal, Show } from "solid-js";
import { uploadImage } from "../lib/api";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import toast from "solid-toast";

interface ImageUploaderProps {
  sessionId: string;
  onUploadComplete?: () => void;
}

export function ImageUploader(props: ImageUploaderProps) {
  const [dragging, setDragging] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  let fileInput!: HTMLInputElement;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      await uploadImage(props.sessionId, file, (pct) => setProgress(pct));
      toast.success("Image uploaded!");
      props.onUploadComplete?.();
    } catch (err: any) {
      toast.error(err.error ?? "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      fileInput.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer?.files ?? null);
  };

  return (
    <div
      class={`border-3 border-dashed rounded-dd-card p-6 text-center transition-colors ${
        dragging() ? "border-dd-primary bg-dd-accent/10" : "border-dd-muted-border bg-white"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <Show
        when={!uploading()}
        fallback={
          <div class="space-y-3">
            <p class="text-sm font-body font-medium text-dd-text">
              Uploading... {progress()}%
            </p>
            <ProgressBar percent={progress()} />
          </div>
        }
      >
        <p class="text-sm font-body text-dd-text-muted mb-3">
          Drag & drop an image here, or click to browse
        </p>
        <input
          ref={fileInput!}
          type="file"
          accept="image/*"
          class="hidden"
          onChange={(e) => handleFiles(e.currentTarget.files)}
        />
        <Button variant="ghost" size="sm" onClick={() => fileInput.click()}>
          Choose File
        </Button>
      </Show>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/components/VoteButton.tsx src/client/components/ImageUploader.tsx
git commit -m "feat(ui): restyle VoteButton with stamp animation and ImageUploader with ProgressBar"
```

---

### Task 15: Restyle Gallery with Animations

**Files:**
- Modify: `src/client/components/Gallery.tsx`

- [ ] **Step 1: Restyle Gallery with borderless cards, stagger animations, and responsive grid**

Replace the entire file content with:

```tsx
import { For, Show, createSignal, onMount } from "solid-js";
import type { ImageResponse, VoteResponse } from "@shared/types";
import { getImageUrl } from "../lib/api";
import { VoteButton } from "./VoteButton";
import { staggerIn } from "../lib/animations";

interface GalleryProps {
  images: ImageResponse[];
  votes: VoteResponse[];
  sessionId: string;
  votingOpen: boolean;
  maxVotes: number;
  onVoteChange?: () => void;
}

export function Gallery(props: GalleryProps) {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  let gridRef!: HTMLDivElement;

  const votedImageIds = () => new Set(props.votes.map((v) => v.imageId));
  const remainingVotes = () => props.maxVotes - props.votes.length;

  onMount(() => {
    if (gridRef) {
      const cards = Array.from(gridRef.children) as HTMLElement[];
      if (cards.length > 0) staggerIn(cards);
    }
  });

  return (
    <div>
      <Show
        when={props.images.length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="font-display font-bold text-dd-text-muted text-lg mb-1">No photos yet</p>
            <p class="font-body text-dd-text-muted text-sm">Be the first to upload!</p>
          </div>
        }
      >
        <div ref={gridRef} class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <For each={props.images}>
            {(image) => (
              <div class="relative aspect-square rounded-dd-photo overflow-hidden group cursor-pointer">
                <img
                  src={getImageUrl(image.r2Key)}
                  alt={image.filename}
                  class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  onClick={() => setSelectedId(image.id)}
                />
                <Show when={props.votingOpen}>
                  <div class="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <VoteButton
                      sessionId={props.sessionId}
                      imageId={image.id}
                      voted={votedImageIds().has(image.id)}
                      disabled={remainingVotes() <= 0}
                      onVoteChange={props.onVoteChange}
                    />
                  </div>
                </Show>
                <Show when={votedImageIds().has(image.id)}>
                  <div class="absolute top-2 right-2 bg-dd-accent rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    ★
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Lightbox */}
      <Show when={selectedId()}>
        <div
          class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div class="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(props.images.find((i) => i.id === selectedId())?.r2Key ?? "")}
              alt="Selected"
              class="w-full h-full object-contain rounded-dd-photo"
            />
            <button
              class="absolute top-3 right-3 bg-dd-primary text-white rounded-dd-pill w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-dd-primary-shadow transition-colors"
              onClick={() => setSelectedId(null)}
            >
              ✕
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/Gallery.tsx
git commit -m "feat(ui): restyle Gallery with borderless cards and stagger animations"
```

---

### Task 16: Restyle SessionDashboard

**Files:**
- Modify: `src/client/components/SessionDashboard.tsx`

- [ ] **Step 1: Restyle SessionDashboard with Toontown card**

Replace the entire file content with:

```tsx
import { Show } from "solid-js";
import type { SessionResponse } from "@shared/types";
import { updateSession } from "../lib/api";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import toast from "solid-toast";

interface SessionDashboardProps {
  session: SessionResponse;
  imageCount: number;
  onSessionUpdate?: () => void;
}

export function SessionDashboard(props: SessionDashboardProps) {
  const toggleUploads = async () => {
    try {
      await updateSession(props.session.id, { uploadOpen: !props.session.uploadOpen });
      props.onSessionUpdate?.();
    } catch (err: any) {
      toast.error(err.error ?? "Failed to update");
    }
  };

  const toggleVoting = async () => {
    try {
      await updateSession(props.session.id, { votingOpen: !props.session.votingOpen });
      props.onSessionUpdate?.();
    } catch (err: any) {
      toast.error(err.error ?? "Failed to update");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="font-body text-sm text-dd-text">Total Images</span>
          <Badge variant="secondary">{props.imageCount}</Badge>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Badge variant={props.session.uploadOpen ? "success" : "primary"}>
              {props.session.uploadOpen ? "Uploads Open" : "Uploads Closed"}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={toggleUploads}>
            {props.session.uploadOpen ? "🔓" : "🔒"}
          </Button>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Badge variant={props.session.votingOpen ? "success" : "primary"}>
              {props.session.votingOpen ? "Voting Open" : "Voting Closed"}
            </Badge>
          </div>
          <Button size="sm" variant="ghost" onClick={toggleVoting}>
            {props.session.votingOpen ? "🔓" : "🔒"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/SessionDashboard.tsx
git commit -m "feat(ui): restyle SessionDashboard with Badge and Card"
```

---

### Task 17: Restyle Session Board Page (Responsive Layout)

**Files:**
- Modify: `src/client/routes/sessions/$code.tsx`

- [ ] **Step 1: Restyle session board with StatusBanner and responsive sidebar layout**

Replace the entire file content with:

```tsx
import { createSignal, createEffect, onMount, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { useSession } from "../../lib/auth-client";
import { getSession, getImages, getMyVotes } from "../../lib/api";
import { createSessionSocket } from "../../lib/ws";
import { Gallery } from "../../components/Gallery";
import { ImageUploader } from "../../components/ImageUploader";
import { SessionDashboard } from "../../components/SessionDashboard";
import { StatusBanner } from "../../components/ui/StatusBanner";
import { PageTransition } from "../../components/PageTransition";
import type { SessionResponse, ImageResponse, VoteResponse } from "@shared/types";
import toast from "solid-toast";

export default function SessionBoard() {
  const params = useParams({ from: "/sessions/$code" });
  const authSession = useSession();

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [images, setImages] = createSignal<ImageResponse[]>([]);
  const [myVotes, setMyVotes] = createSignal<VoteResponse[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const isOwner = () => session()?.createdBy === authSession()?.data?.user?.id;

  const fetchData = async () => {
    try {
      const sess = await getSession(params.code);
      setSession(sess);

      const [imgs, votes] = await Promise.all([
        getImages(sess.id),
        getMyVotes(sess.id),
      ]);
      setImages(imgs);
      setMyVotes(votes);
    } catch (err: any) {
      setError(err.error ?? "Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchData);

  createEffect(() => {
    const sess = session();
    if (!sess) return;

    const { lastEvent } = createSessionSocket(sess.id);

    createEffect(() => {
      const event = lastEvent();
      if (!event) return;

      switch (event.type) {
        case "image-added":
          setImages((prev) => [...prev, event.data]);
          break;
        case "image-removed":
          setImages((prev) => prev.filter((i) => i.id !== event.data.id));
          break;
        case "vote-cast":
          if (event.data.userId === authSession()?.data?.user?.id) {
            getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "vote-removed":
          if (event.data.userId === authSession()?.data?.user?.id) {
            getMyVotes(sess.id).then(setMyVotes);
          }
          break;
        case "session-updated":
          setSession((prev) =>
            prev ? { ...prev, uploadOpen: event.data.uploadOpen, votingOpen: event.data.votingOpen } : prev
          );
          break;
      }
    });
  });

  return (
    <PageTransition>
      <div class="container mx-auto px-4 py-4">
        <Show when={!loading()} fallback={
          <div class="text-center py-12 font-body text-dd-text-muted">Loading session...</div>
        }>
          <Show when={!error()} fallback={
            <div class="text-center py-12 font-body text-dd-primary">{error()}</div>
          }>
            <Show when={session()}>
              {(sess) => (
                <div class="space-y-4">
                  {/* Status Banner */}
                  <StatusBanner variant={sess().votingOpen ? "success" : "warning"}>
                    {sess().votingOpen ? (
                      <span>Voting Open — {sess().maxVotesPerUser - myVotes().length} votes remaining</span>
                    ) : (
                      <span>
                        Voting Closed —{" "}
                        <Link
                          to="/sessions/$code/results"
                          params={{ code: params.code }}
                          class="underline hover:no-underline"
                        >
                          View Results
                        </Link>
                      </span>
                    )}
                  </StatusBanner>

                  {/* Responsive layout: stacked on mobile, sidebar on md+ */}
                  <div class="flex flex-col md:flex-row gap-4">
                    {/* Main: Gallery */}
                    <div class="flex-1 min-w-0">
                      <Gallery
                        images={images()}
                        votes={myVotes()}
                        sessionId={sess().id}
                        votingOpen={sess().votingOpen}
                        maxVotes={sess().maxVotesPerUser}
                        onVoteChange={fetchData}
                      />
                    </div>

                    {/* Sidebar: Dashboard + Uploader (on md+) */}
                    <div class="w-full md:w-72 shrink-0 space-y-4 order-first md:order-last">
                      <Show when={isOwner()}>
                        <SessionDashboard
                          session={sess()}
                          imageCount={images().length}
                          onSessionUpdate={fetchData}
                        />
                      </Show>

                      <Show when={sess().uploadOpen}>
                        <ImageUploader sessionId={sess().id} onUploadComplete={fetchData} />
                      </Show>
                    </div>
                  </div>
                </div>
              )}
            </Show>
          </Show>
        </Show>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/sessions/\$code.tsx
git commit -m "feat(ui): restyle session board with responsive sidebar and StatusBanner"
```

---

### Task 18: Restyle Results Page

**Files:**
- Modify: `src/client/routes/sessions/$code.results.tsx`

- [ ] **Step 1: Restyle results with podium cards and stagger animation**

Replace the entire file content with:

```tsx
import { createSignal, onMount, For, Show } from "solid-js";
import { useParams, Link } from "@tanstack/solid-router";
import { getSession, getResults, getImageUrl } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { PageTransition } from "../../components/PageTransition";
import { staggerIn } from "../../lib/animations";
import type { SessionResponse, ResultItem } from "@shared/types";

export default function Results() {
  const params = useParams({ from: "/sessions/$code/results" });

  const [session, setSession] = createSignal<SessionResponse | null>(null);
  const [results, setResults] = createSignal<ResultItem[]>([]);
  const [loading, setLoading] = createSignal(true);
  let listRef!: HTMLDivElement;

  onMount(async () => {
    try {
      const sess = await getSession(params.code);
      setSession(sess);
      const res = await getResults(sess.id);
      setResults(res);
    } catch {
      // Error handled by loading state
    } finally {
      setLoading(false);
      // Stagger animation after results render
      requestAnimationFrame(() => {
        if (listRef) {
          const rows = Array.from(listRef.children) as HTMLElement[];
          if (rows.length > 0) staggerIn(rows);
        }
      });
    }
  });

  const podiumStyle = (index: number) => {
    if (index === 0) return "bg-dd-accent/20 border-dd-accent-shadow/30";
    if (index === 1) return "bg-dd-secondary/10 border-dd-secondary/30";
    if (index === 2) return "bg-dd-primary/10 border-dd-primary/30";
    return "bg-white border-dd-muted-border";
  };

  return (
    <PageTransition>
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-4 mb-6">
          <Link to="/sessions/$code" params={{ code: params.code }}>
            <Button variant="ghost" size="sm">← Back</Button>
          </Link>
          <h1 class="text-2xl font-display font-black text-dd-text">Results</h1>
        </div>

        <Show when={!loading()} fallback={
          <div class="text-center py-12 font-body text-dd-text-muted">Loading results...</div>
        }>
          <div ref={listRef} class="space-y-3 max-w-2xl mx-auto">
            <For each={results()}>
              {(item, index) => (
                <div class={`flex items-center gap-4 p-3 rounded-dd-card border-2 ${podiumStyle(index())}`}>
                  <span class="text-2xl font-display font-black w-10 text-center">
                    {index() === 0 ? "🥇" : index() === 1 ? "🥈" : index() === 2 ? "🥉" : `${index() + 1}`}
                  </span>
                  <img
                    src={getImageUrl(item.r2Key)}
                    alt={item.filename}
                    class="w-16 h-16 rounded-dd-photo object-cover"
                  />
                  <div class="flex-1">
                    <p class="text-sm font-body text-dd-text-muted truncate">{item.filename}</p>
                  </div>
                  <span class="text-lg font-display font-black text-dd-text">
                    {item.voteCount} {item.voteCount === 1 ? "vote" : "votes"}
                  </span>
                </div>
              )}
            </For>

            <Show when={results().length === 0}>
              <div class="text-center py-12">
                <p class="font-display font-bold text-dd-text-muted">
                  No results yet — no images have been uploaded.
                </p>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/routes/sessions/\$code.results.tsx
git commit -m "feat(ui): restyle Results page with podium cards and stagger animation"
```

---

### Task 19: Restyle ToS and Policy Pages

**Files:**
- Modify: `src/client/routes/tos.tsx`
- Modify: `src/client/routes/policy.tsx`

- [ ] **Step 1: Restyle ToS page**

Replace the entire file content with:

```tsx
import { PageTransition } from "../components/PageTransition";

export default function ToS() {
  return (
    <PageTransition>
      <div class="max-w-2xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-display font-black text-dd-text mb-6">Terms of Service</h1>
        <div class="space-y-4 font-body text-dd-text leading-relaxed">
          <p>By using DouDou, you agree to these terms.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Usage</h2>
          <p>DouDou is a photo competition platform. You may upload images you own or have rights to share. Do not upload inappropriate, illegal, or copyrighted content.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Accounts</h2>
          <p>You are responsible for maintaining the security of your account. We use email-based authentication.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Content</h2>
          <p>You retain ownership of images you upload. By uploading, you grant DouDou a license to display the image within the platform for the purpose of the competition.</p>
        </div>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Restyle Policy page**

Replace the entire file content with:

```tsx
import { PageTransition } from "../components/PageTransition";

export default function Policy() {
  return (
    <PageTransition>
      <div class="max-w-2xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-display font-black text-dd-text mb-6">Privacy Policy</h1>
        <div class="space-y-4 font-body text-dd-text leading-relaxed">
          <p>Your privacy matters to us.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Data We Collect</h2>
          <p>We collect your email address for authentication and the images you upload to competition sessions.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">How We Use Data</h2>
          <p>Your data is used solely to operate the competition platform. We do not sell your data to third parties.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Data Storage</h2>
          <p>Data is stored on Cloudflare infrastructure. Images are stored in Cloudflare R2.</p>
          <h2 class="text-xl font-display font-bold text-dd-text pt-2">Contact</h2>
          <p>For questions about your data, contact us at privacy@doudou.muniee.com.</p>
        </div>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/client/routes/tos.tsx src/client/routes/policy.tsx
git commit -m "feat(ui): restyle ToS and Policy pages with Toontown typography"
```

---

### Task 20: Verify Build and Fix Issues

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No type errors. If there are errors, fix them (likely `border-3` may need adding to Tailwind config or using `border-[3px]` instead).

- [ ] **Step 2: Run Vite build**

```bash
npm run build
```

Expected: Clean build. Fix any import errors or missing modules.

- [ ] **Step 3: Fix any issues found**

Common issues to watch for:
- `border-3` is not a default Tailwind class. If it causes issues, replace all `border-3` with `border-[3px]` across all files.
- `h-13` is not default Tailwind. Replace with `h-[3.25rem]` if needed.
- `useParams({ strict: false })` may not be valid in TanStack Solid Router at root level. If it errors, remove the session code logic from `__root.tsx` and pass it differently.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix(ui): resolve build issues from design system migration"
```
