/* =========================================================
   FORGE FITNESS - shared JavaScript
   Each feature lives in its own small function so it can be
   reused later (and converted to React hooks/components).
   ========================================================= */

/**
 * Image fallback:
 * If a hero image fails to load, hide it so the charcoal
 * panel behind it is shown instead of a broken-image icon.
 */
function setupImageFallbacks() {
  const images = document.querySelectorAll(".hero-img");

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

/**
 * Runs when the page has finished loading.
 * More features will be added here on later pages.
 */
document.addEventListener("DOMContentLoaded", function () {
  setupImageFallbacks();
});
