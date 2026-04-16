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

// --- Lightbox animations ---

export function lightboxOpen(el: HTMLElement) {
  return gsap.fromTo(el,
    { scale: 0.9, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
  );
}

export function lightboxClose(el: HTMLElement) {
  return gsap.to(el, {
    scale: 0.9,
    opacity: 0,
    duration: 0.2,
    ease: "power2.in",
  });
}

export function imageNavigate(outEl: HTMLElement, inEl: HTMLElement) {
  const tl = gsap.timeline();
  tl.to(outEl, { opacity: 0, duration: 0.15, ease: "power2.in" });
  tl.fromTo(inEl, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" });
  return tl;
}

// --- Vote animations ---

export function goldenPulse(el: HTMLElement) {
  gsap.fromTo(el,
    { scale: 1, backgroundColor: "#FFCB47" },
    { scale: 1.2, duration: 0.15, ease: "power2.out",
      onComplete: () => {
        gsap.to(el, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" });
      }
    }
  );
}

export function voteUndo(el: HTMLElement) {
  return gsap.to(el, {
    scale: 0,
    opacity: 0,
    duration: 0.25,
    ease: "power2.in",
  });
}

export function countdownPulse(el: HTMLElement) {
  gsap.fromTo(el,
    { scale: 1 },
    { scale: 1.15, duration: 0.15, ease: "power2.out",
      onComplete: () => {
        gsap.to(el, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
      }
    }
  );
}

// --- Reveal animations ---

export function revealSlideFromLeft(el: HTMLElement) {
  return gsap.fromTo(el,
    { x: -100, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
  );
}

export function revealSlideFromRight(el: HTMLElement) {
  return gsap.fromTo(el,
    { x: 100, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
  );
}

export function revealScaleUp(el: HTMLElement) {
  return gsap.fromTo(el,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }
  );
}
