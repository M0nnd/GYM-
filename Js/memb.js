/* =========================================================
   FORGE FITNESS - shared JavaScript
   Each feature lives in its own small function so it can be
   reused later (and converted to React hooks/components).
   Every function does nothing if its elements are missing,
   so this file is safe to load on every page.
   ========================================================= */

/* ===== STORAGE KEYS START ===== */
/**
 * All localStorage keys in one place so every page uses the same names.
 */
const STORAGE_KEYS = {
  selectedMembership: "forgeSelectedMembership"
};
/* ===== STORAGE KEYS END ===== */

/* ===== IMAGE FALLBACK START ===== */
/**
 * If an image fails to load, hide it so the charcoal panel
 * behind it is shown instead of a broken-image icon.
 * Works for the welcome page (.hero-img) and any image
 * marked with the .img-fallback class.
 */
function setupImageFallbacks() {
  const images = document.querySelectorAll(".hero-img, .img-fallback");

  images.forEach(function (img) {
    // Case 1: the image already failed before this script ran
    if (img.complete && img.naturalWidth === 0) {
      img.classList.add("img-failed");
    }

    // Case 2: the image fails later
    img.addEventListener("error", function () {
      img.classList.add("img-failed");
    });
  });
}
/* ===== IMAGE FALLBACK END ===== */

/* ===== ACTIVE NAV LINK START ===== */
/**
 * Highlights the navbar link that matches the current page,
 * e.g. on programs.html the "Programs" link becomes active.
 * Reuses the same navbar markup on every page.
 */
function highlightActiveNavLink() {
  const links = document.querySelectorAll(".site-navbar .nav-link");
  if (links.length === 0) return;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  links.forEach(function (link) {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}
/* ===== ACTIVE NAV LINK END ===== */

/* ===== MEMBERSHIP SELECTION START ===== */
/**
 * Saved format in localStorage (key: forgeSelectedMembership):
 * { "name": "Pro", "price": 800, "currency": "EGP", "period": "month", "selectedAt": "..." }
 */
function saveSelectedMembership(plan) {
  try {
    localStorage.setItem(STORAGE_KEYS.selectedMembership, JSON.stringify(plan));
    return true;
  } catch (error) {
    return false; // storage blocked or full: the page still navigates normally
  }
}

/**
 * Reusable by the future Join page to show the chosen plan.
 * Returns the plan object, or null if nothing valid is saved.
 */
function getSelectedMembership() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.selectedMembership);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
}

/** Builds a plan object from the data-plan-* attributes of a button. */
function readPlanFromButton(button) {
  const name = button.dataset.planName;
  const price = Number(button.dataset.planPrice);

  if (!name || Number.isNaN(price)) return null;

  return {
    name: name,
    price: price,
    currency: button.dataset.planCurrency || "EGP",
    period: button.dataset.planPeriod || "month",
    selectedAt: new Date().toISOString()
  };
}

/**
 * Saves the plan when a "Choose Plan" button is clicked.
 * The link itself then navigates to join.html.
 */
function setupMembershipSelection() {
  const buttons = document.querySelectorAll("[data-plan-name]");
  if (buttons.length === 0) return;

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      const plan = readPlanFromButton(button);
      if (plan) saveSelectedMembership(plan);
    });
  });
}
/* ===== MEMBERSHIP SELECTION END ===== */

/**
 * Runs when the page has finished loading.
 * More features will be added here on later pages.
 */
document.addEventListener("DOMContentLoaded", function () {
  setupImageFallbacks();
  highlightActiveNavLink();
  setupMembershipSelection();
});
