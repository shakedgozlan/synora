const DESIGN_WIDTH = 1220;
const stage = document.querySelector(".stage");
const overviewSection = document.querySelector(".overview");

function applyScale() {
  const scale = window.innerWidth / DESIGN_WIDTH;
  stage.style.transform = `scale(${scale})`;
  if (overviewSection) {
    overviewSection.style.minHeight = `${window.innerHeight / scale}px`;
  }
  document.body.style.height = `${stage.getBoundingClientRect().height}px`;
}

applyScale();
window.addEventListener("resize", applyScale);
window.addEventListener("load", applyScale);
document.fonts?.ready.then(applyScale);

/* ---- Hero intro gate: hold on the raw video for 2s, then reveal the fade + unlock scroll ---- */

const heroVideo = document.querySelector(".hero-video");
const heroFade = document.querySelector(".hero-fade");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let introLocked = !prefersReducedMotion && !!heroVideo;

function blockScrollKeys(e) {
  const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"];
  if (keys.includes(e.key)) e.preventDefault();
}

function releaseIntro() {
  if (!introLocked) return;
  introLocked = false;
  heroFade?.classList.add("is-visible");
  window.removeEventListener("keydown", blockScrollKeys);
}

if (introLocked) {
  window.addEventListener("keydown", blockScrollKeys, { passive: false });
  window.setTimeout(releaseIntro, 2000);
}

/* ---- Smooth (eased) scrolling ---- */

let currentScroll = window.scrollY;
let targetScroll = window.scrollY;
const SCROLL_EASE = 0.05;

function maxScroll() {
  return Math.max(0, document.body.scrollHeight - window.innerHeight);
}

window.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) return; // let pinch-zoom through
    e.preventDefault();
    if (introLocked) return;
    const delta = Math.max(-120, Math.min(120, e.deltaY)) * 0.8;
    targetScroll = Math.min(Math.max(targetScroll + delta, 0), maxScroll());
  },
  { passive: false }
);

window.addEventListener("touchmove", (e) => {
  if (introLocked) e.preventDefault();
}, { passive: false });

function smoothScrollLoop() {
  if (introLocked) {
    currentScroll = 0;
    targetScroll = 0;
  } else {
    targetScroll = Math.min(targetScroll, maxScroll());
  }
  currentScroll += (targetScroll - currentScroll) * SCROLL_EASE;
  if (Math.abs(targetScroll - currentScroll) < 0.4) currentScroll = targetScroll;
  window.scrollTo(0, currentScroll);
  requestAnimationFrame(smoothScrollLoop);
}
requestAnimationFrame(smoothScrollLoop);

window.addEventListener("scroll", () => {
  // Hard failsafe: whatever caused this scroll (scrollbar drag, programmatic, etc.),
  // snap straight back while the intro is still gated.
  if (introLocked) {
    if (window.scrollY !== 0) window.scrollTo(0, 0);
    return;
  }
  // Keep the eased scroll in sync with scrolls we didn't originate (e.g. touch, keyboard nav past the gate).
  if (Math.abs(window.scrollY - currentScroll) > 2 && Math.abs(window.scrollY - targetScroll) > 60) {
    currentScroll = window.scrollY;
    targetScroll = window.scrollY;
  }
});

/* ---- Scroll-in reveal for sections ---- */

const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

if (window.ResizeObserver) {
  new ResizeObserver(applyScale).observe(document.documentElement);
}

const screensData = {
  home: {
    headline: "Windows <em>peeking</em> into other people's worlds.",
    swatch: "assets/screens/home-swatch.svg",
    swatchIsVector: true,
    caption: "The home page is a grid of windows, each showing a world someone created.<br>It shows what Synora can do, and invites people to look closer.",
    before: "assets/homewireframe.webp",
    after: "assets/herodesign.webp",
  },
  explore: {
    headline: "Every world shows how it was <em>made.</em>",
    swatch: "assets/exploreresearch.webp",
    swatchIsVector: false,
    caption: "Explore is a library of worlds people created. Each one opens to reveal its prompts, models and settings, so others can learn and build on them.",
    before: "assets/exporewireframe.webp",
    after: "assets/exploredesign.webp",
  },
  create: {
    headline: "From <em>picture to score</em>, in one flow.",
    swatch: "assets/createresearch.webp",
    swatchIsVector: false,
    caption: "The Create page works like a canvas built for making a film. Open space frames the generated video like a cinema screen, so creating feels like watching your world come to life.",
    before: "assets/createwireframe.webp",
    after: "assets/createdesign.webp",
  },
};

const screensTabButtons = document.querySelectorAll("[data-screens-tab]");
const screensToggleButtons = document.querySelectorAll("[data-screens-toggle]");
const screensFrameImg = document.getElementById("screens-frame-img");
const screensHeadline = document.getElementById("screens-headline");
const screensSwatch = document.getElementById("screens-swatch");
const screensSwatchImg = document.getElementById("screens-swatch-img");
const screensCaption = document.getElementById("screens-caption");

function fadeScreensFrame(src) {
  if (screensFrameImg.getAttribute("src").endsWith(src)) return;
  screensFrameImg.classList.add("is-fading");
  window.setTimeout(() => {
    screensFrameImg.src = src;
    screensFrameImg.classList.remove("is-fading");
  }, 250);
}

screensToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    screensToggleButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");
    fadeScreensFrame(button.dataset.screensToggle);
  });
});

screensTabButtons.forEach((tab) => {
  tab.addEventListener("click", () => {
    const data = screensData[tab.dataset.screensTab];
    if (!data) return;

    screensTabButtons.forEach((btn) => btn.classList.remove("screens-tab--active"));
    tab.classList.add("screens-tab--active");

    screensHeadline.innerHTML = data.headline;
    screensCaption.innerHTML = data.caption;
    screensSwatch.classList.toggle("screens-swatch--vector", data.swatchIsVector);
    screensSwatchImg.src = data.swatch;

    screensToggleButtons.forEach((btn) => {
      const isBefore = btn.classList.contains("screens-toggle-item--before");
      btn.dataset.screensToggle = isBefore ? data.before : data.after;
      btn.classList.toggle("is-active", isBefore);
    });

    fadeScreensFrame(data.before);
  });
});
