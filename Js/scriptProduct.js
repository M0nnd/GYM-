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
  selectedMembership: "forgeSelectedMembership",
  cart: "forgeCart",
  favorites: "forgeFavorites"
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

/* ===== SHARED HELPERS START ===== */
/** Reads JSON from localStorage. Returns the fallback if nothing valid is saved. */
function readStorageJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

/** Writes JSON to localStorage. Returns true on success. */
function writeStorageJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

/** Escapes text before it is placed inside an HTML template string. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Formats a number as US dollars (the demo products API returns USD). */
function formatPrice(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

/** "sports-accessories" becomes "Sports Accessories". */
function formatCategory(value) {
  return String(value).replace(/[-_]+/g, " ").replace(/\b\w/g, function (letter) {
    return letter.toUpperCase();
  });
}

/** Briefly changes a button label (e.g. "ADDED") and then restores it. */
function flashButtonLabel(button, label) {
  if (!button.dataset.originalLabel) {
    button.dataset.originalLabel = button.textContent;
  }

  button.textContent = label;
  clearTimeout(Number(button.dataset.labelTimer));
  button.dataset.labelTimer = String(setTimeout(function () {
    button.textContent = button.dataset.originalLabel;
  }, 1200));
}
/* ===== SHARED HELPERS END ===== */

/* ===== CART AND FAVORITES START ===== */
/**
 * Cart format (key: forgeCart):
 * [{ "id": 1, "title": "...", "price": 9.99, "image": "...", "quantity": 2 }]
 */
function getCart() {
  const cart = readStorageJSON(STORAGE_KEYS.cart, []);
  return Array.isArray(cart) ? cart : [];
}

function saveCart(cart) {
  return writeStorageJSON(STORAGE_KEYS.cart, cart);
}

/** Adds one item, or increases the quantity if it is already in the cart. */
function addToCart(product) {
  const cart = getCart();
  const existingItem = cart.find(function (item) {
    return item.id === product.id;
  });

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  const saved = saveCart(cart);
  updateCartBadge();
  return saved;
}

function getCartCount() {
  return getCart().reduce(function (total, item) {
    return total + (Number(item.quantity) || 0);
  }, 0);
}

/**
 * Shows the number of cart items on the navbar cart icon.
 * The badge is created here, so no page markup needs to change.
 */
function updateCartBadge() {
  const cartLink = document.querySelector(".site-navbar .nav-cart");
  if (!cartLink) return;

  let badge = cartLink.querySelector(".cart-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "cart-badge";
    cartLink.appendChild(badge);
  }

  const count = getCartCount();
  badge.textContent = count > 99 ? "99+" : String(count);
  badge.hidden = count === 0;
  cartLink.setAttribute("aria-label", count > 0 ? "Shopping cart, " + count + " items" : "Shopping cart");
}

/** Favorites are saved as a list of product ids (key: forgeFavorites). */
function getFavorites() {
  const favorites = readStorageJSON(STORAGE_KEYS.favorites, []);
  return Array.isArray(favorites) ? favorites : [];
}

/** Adds or removes a product id. Returns true if it is now a favorite. */
function toggleFavorite(productId) {
  const favorites = getFavorites();
  const index = favorites.indexOf(productId);

  if (index === -1) {
    favorites.push(productId);
  } else {
    favorites.splice(index, 1);
  }

  writeStorageJSON(STORAGE_KEYS.favorites, favorites);
  return index === -1;
}
/* ===== CART AND FAVORITES END ===== */

/* ===== PRODUCTS PAGE START ===== */
/** Main endpoint first; the general endpoint is used only if the first one fails or is empty. */
function getProductApiUrls() {
  return [
    "https://dummyjson.com/products/category/sports-accessories",
    "https://dummyjson.com/products?limit=30"
  ];
}

/** Keeps only the fields we use and does not assume optional fields exist. */
function normalizeProduct(raw) {
  if (!raw || raw.id === undefined || !raw.title) return null;

  const price = Number(raw.price);
  if (!Number.isFinite(price)) return null;

  const images = Array.isArray(raw.images) ? raw.images : [];
  const hasRating = raw.rating !== undefined && raw.rating !== null && Number.isFinite(Number(raw.rating));

  return {
    id: raw.id,
    title: String(raw.title),
    description: raw.description ? String(raw.description) : "",
    category: raw.category ? String(raw.category) : "",
    price: price,
    rating: hasRating ? Number(raw.rating) : null,
    image: raw.thumbnail || images[0] || ""
  };
}

async function fetchProducts() {
  for (const url of getProductApiUrls()) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      const rawProducts = Array.isArray(data.products) ? data.products : [];
      const products = rawProducts.map(normalizeProduct).filter(Boolean);

      if (products.length > 0) return products;
    } catch (error) {
      // network or JSON error: try the next endpoint
    }
  }

  throw new Error("No products could be loaded");
}

/** Search and category filtering, then sorting. Works on data already fetched. */
function filterAndSortProducts(products, filters) {
  const term = filters.search.trim().toLowerCase();

  const result = products.filter(function (product) {
    const matchesSearch = !term || product.title.toLowerCase().includes(term);
    const matchesCategory = filters.category === "all" || product.category === filters.category;
    return matchesSearch && matchesCategory;
  });

  if (filters.sort === "price-asc") {
    result.sort(function (a, b) { return a.price - b.price; });
  } else if (filters.sort === "price-desc") {
    result.sort(function (a, b) { return b.price - a.price; });
  }

  return result;
}

function getFavoriteLabel(isFavorite, title) {
  return isFavorite ? "Remove " + title + " from favorites" : "Add " + title + " to favorites";
}

function setFavoriteButtonState(button, isFavorite, title) {
  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute("aria-label", getFavoriteLabel(isFavorite, title));

  const icon = button.querySelector("i");
  if (icon) icon.className = isFavorite ? "bi bi-heart-fill" : "bi bi-heart";
}

function createRatingHTML(rating) {
  return '<i class="bi bi-star-fill" aria-hidden="true"></i>' +
    '<span class="visually-hidden">Rating: </span>' + rating.toFixed(1);
}

function createProductCardHTML(product, isFavorite) {
  const title = escapeHtml(product.title);
  const image = product.image
    ? '<img src="' + escapeHtml(product.image) + '" alt="' + title + '" class="img-fallback" loading="lazy">'
    : "";
  const category = product.category
    ? '<p class="product-category">' + escapeHtml(formatCategory(product.category)) + "</p>"
    : "";
  const rating = product.rating !== null
    ? '<span class="product-rating">' + createRatingHTML(product.rating) + "</span>"
    : "";

  return '<div class="col-12 col-sm-6 col-lg-4 col-xl-3">' +
    '<article class="forge-card product-card" data-product-id="' + escapeHtml(product.id) + '">' +
      '<div class="product-card-media">' + image +
        '<button type="button" class="product-fav" data-action="favorite" aria-pressed="' + isFavorite + '" aria-label="' +
          escapeHtml(getFavoriteLabel(isFavorite, product.title)) + '">' +
          '<i class="bi ' + (isFavorite ? "bi-heart-fill" : "bi-heart") + '" aria-hidden="true"></i>' +
        "</button>" +
      "</div>" +
      '<div class="product-card-body">' + category +
        '<h3 class="product-title">' + title + "</h3>" +
        '<div class="product-meta">' +
          '<span class="product-price">' + formatPrice(product.price) + "</span>" + rating +
        "</div>" +
        '<div class="product-actions">' +
          '<button type="button" class="btn btn-forge-dark btn-forge-sm" data-action="add">ADD TO CART</button>' +
          '<button type="button" class="btn btn-forge-outline btn-forge-sm" data-action="details">VIEW DETAILS</button>' +
        "</div>" +
      "</div>" +
    "</article>" +
  "</div>";
}

function createSkeletonHTML(count) {
  const card = '<div class="col-12 col-sm-6 col-lg-4 col-xl-3">' +
    '<div class="forge-card product-card product-skeleton" aria-hidden="true">' +
      '<div class="product-card-media"></div>' +
      '<div class="product-card-body">' +
        '<span class="skeleton-line skeleton-line-short"></span>' +
        '<span class="skeleton-line"></span>' +
        '<span class="skeleton-line skeleton-line-short"></span>' +
      "</div>" +
    "</div>" +
  "</div>";

  return card.repeat(count);
}

/** Fills the category dropdown using the categories found in the fetched products. */
function populateCategoryOptions(select, products, selectedCategory) {
  const categories = Array.from(new Set(products.map(function (product) {
    return product.category;
  }).filter(Boolean))).sort();

  select.innerHTML = '<option value="all">All categories</option>' + categories.map(function (category) {
    return '<option value="' + escapeHtml(category) + '">' + escapeHtml(formatCategory(category)) + "</option>";
  }).join("");

  select.value = categories.includes(selectedCategory) ? selectedCategory : "all";
}

function setupProductsPage() {
  const grid = document.getElementById("productGrid");
  const searchInput = document.getElementById("productSearch");
  const searchForm = document.getElementById("productSearchForm");
  const categorySelect = document.getElementById("categoryFilter");
  const sortSelect = document.getElementById("sortSelect");
  const countText = document.getElementById("productCount");
  const errorBox = document.getElementById("productsError");
  const emptyBox = document.getElementById("productsEmpty");
  const status = document.getElementById("productsStatus");

  if (!grid || !searchInput || !categorySelect || !sortSelect || !countText || !errorBox || !emptyBox) return;

  const modalElement = document.getElementById("productModal");
  const filters = { search: "", category: "all", sort: "default" };
  let products = [];
  let isLoaded = false;
  let activeProduct = null;

  function announce(message) {
    if (!status) return;
    status.textContent = "";
    status.textContent = message;
  }

  function setView(view) {
    errorBox.hidden = view !== "error";
    emptyBox.hidden = view !== "empty";
    grid.hidden = view === "error" || view === "empty";
    grid.setAttribute("aria-busy", String(view === "loading"));
  }

  function renderProducts() {
    const visibleProducts = filterAndSortProducts(products, filters);
    countText.textContent = visibleProducts.length + (visibleProducts.length === 1 ? " product found" : " products found");

    if (visibleProducts.length === 0) {
      grid.innerHTML = "";
      setView("empty");
      return;
    }

    const favorites = getFavorites();
    grid.innerHTML = visibleProducts.map(function (product) {
      return createProductCardHTML(product, favorites.includes(product.id));
    }).join("");
    setView("grid");
  }

  function renderIfLoaded() {
    if (isLoaded) renderProducts();
  }

  async function loadProducts() {
    isLoaded = false;
    setView("loading");
    grid.innerHTML = createSkeletonHTML(8);
    countText.textContent = "Loading products...";

    try {
      products = await fetchProducts();
      populateCategoryOptions(categorySelect, products, filters.category);
      filters.category = categorySelect.value;
      isLoaded = true;
      renderProducts();
    } catch (error) {
      grid.innerHTML = "";
      countText.textContent = "Products unavailable";
      setView("error");
    }
  }

  function clearFilters() {
    filters.search = "";
    filters.category = "all";
    filters.sort = "default";
    searchInput.value = "";
    categorySelect.value = "all";
    sortSelect.value = "default";
    renderIfLoaded();
  }

  function addProductToCart(product, button) {
    const saved = addToCart(product);

    if (saved) {
      flashButtonLabel(button, "ADDED");
      announce(product.title + " added to cart.");
    } else {
      announce("Could not save the cart. Browser storage may be blocked.");
    }
  }

  function openDetails(product) {
    if (!modalElement || typeof bootstrap === "undefined") return;

    const image = document.getElementById("productModalImage");
    const rating = document.getElementById("productModalRating");

    activeProduct = product;
    document.getElementById("productModalTitle").textContent = product.title;
    document.getElementById("productModalCategory").textContent = product.category ? formatCategory(product.category) : "";
    document.getElementById("productModalPrice").textContent = formatPrice(product.price);
    document.getElementById("productModalDescription").textContent = product.description || "No description available.";

    rating.hidden = product.rating === null;
    if (product.rating !== null) rating.innerHTML = createRatingHTML(product.rating);

    image.classList.remove("img-failed");
    image.hidden = !product.image;
    if (product.image) {
      image.src = product.image;
      image.alt = product.title;
    }

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
  }

  function findProductFromElement(element) {
    const card = element.closest("[data-product-id]");
    if (!card) return null;

    return products.find(function (product) {
      return String(product.id) === card.dataset.productId;
    }) || null;
  }

  grid.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const product = findProductFromElement(button);
    if (!product) return;

    if (button.dataset.action === "add") {
      addProductToCart(product, button);
    } else if (button.dataset.action === "favorite") {
      setFavoriteButtonState(button, toggleFavorite(product.id), product.title);
    } else if (button.dataset.action === "details") {
      openDetails(product);
    }
  });

  // Image "error" events do not bubble, so listen in the capture phase.
  grid.addEventListener("error", function (event) {
    if (event.target.tagName === "IMG") event.target.classList.add("img-failed");
  }, true);

  searchInput.addEventListener("input", function () {
    filters.search = searchInput.value;
    renderIfLoaded();
  });

  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }

  categorySelect.addEventListener("change", function () {
    filters.category = categorySelect.value;
    renderIfLoaded();
  });

  sortSelect.addEventListener("change", function () {
    filters.sort = sortSelect.value;
    renderIfLoaded();
  });

  document.querySelectorAll('[data-action="clear-filters"]').forEach(function (button) {
    button.addEventListener("click", clearFilters);
  });

  const retryButton = document.getElementById("retryProducts");
  if (retryButton) retryButton.addEventListener("click", loadProducts);

  const modalAddButton = document.getElementById("productModalAdd");
  if (modalAddButton) {
    modalAddButton.addEventListener("click", function () {
      if (activeProduct) addProductToCart(activeProduct, modalAddButton);
    });
  }

  loadProducts();
}
/* ===== PRODUCTS PAGE END ===== */

/**
 * Runs when the page has finished loading.
 * More features will be added here on later pages.
 */
document.addEventListener("DOMContentLoaded", function () {
  setupImageFallbacks();
  highlightActiveNavLink();
  setupMembershipSelection();
  updateCartBadge();
  setupProductsPage();
});
