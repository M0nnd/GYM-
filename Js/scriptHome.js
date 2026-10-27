/* =========================================================
   FORGE FITNESS - shared JavaScript
   Each feature lives in its own small function so it can be
   reused later (and converted to React hooks/components).
   Every function does nothing if its elements are missing,
   so this file is safe to load on every page.
   ========================================================= */

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

/**
 * Runs when the page has finished loading.
 * More features will be added here on later pages.
 */
document.addEventListener("DOMContentLoaded", function () {
  setupImageFallbacks();
  highlightActiveNavLink();
});
