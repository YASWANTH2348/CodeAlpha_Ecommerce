const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});
const $ = (selector) => document.querySelector(selector);
const grid = $("#product-grid");
const carouselSlides = Array.from(document.querySelectorAll(".hero-slide"));
const carouselTrack = $("#hero-carousel-track");
const cart = loadCart();
let products = [];
let activeFilter = "All";
let currentUser = null;
let toastTimer;
let carouselIndex = 0;
let carouselTimer;
const preferencesKey = "eshop-preferences";

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("eshop-cart") || "[]");
    return Array.isArray(saved) ? saved.filter((item) =>
      Number.isSafeInteger(item.id) && Number.isSafeInteger(item.quantity) && item.quantity > 0
    ) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("eshop-cart", JSON.stringify(cart));
  renderCart();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[character]);
}

function money(amount) {
  return currency.format(amount);
}

function showCarouselSlide(index) {
  carouselIndex = (index + carouselSlides.length) % carouselSlides.length;
  carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
  carouselSlides.forEach((slide, slideIndex) => {
    slide.setAttribute("aria-hidden", String(slideIndex !== carouselIndex));
  });
  document.querySelectorAll("[data-carousel-slide]").forEach((dot, dotIndex) => {
    if (dotIndex === carouselIndex) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
  $("#carousel-title").textContent = carouselSlides[carouselIndex].dataset.title;
  $("#carousel-edition").textContent = carouselSlides[carouselIndex].dataset.edition;
}

function stopCarousel() {
  clearInterval(carouselTimer);
  carouselTimer = null;
}

function startCarousel() {
  stopCarousel();
  if (carouselSlides.length < 2 || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  carouselTimer = setInterval(() => showCarouselSlide(carouselIndex + 1), 6000);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function renderProducts() {
  const searchTerm = $("#product-search").value.trim().toLocaleLowerCase();
  const priceRange = $("#price-filter").value;
  const inStockOnly = $("#availability-filter").value === "in-stock";
  const selected = products.filter((product) => {
    const matchesCategory = activeFilter === "All" || product.category === activeFilter;
    const matchesSearch = !searchTerm || `${product.name} ${product.category} ${product.description}`
      .toLocaleLowerCase().includes(searchTerm);
    const matchesAvailability = !inStockOnly || product.stock > 0;
    const matchesPrice = priceRange === "all"
      || (priceRange === "under-5000" && product.price < 5000)
      || (priceRange === "5000-10000" && product.price >= 5000 && product.price <= 10000)
      || (priceRange === "over-10000" && product.price > 10000);
    return matchesCategory && matchesSearch && matchesAvailability && matchesPrice;
  });
  const sort = $("#sort-select").value;
  if (sort === "price-low") selected.sort((a, b) => a.price - b.price);
  if (sort === "price-high") selected.sort((a, b) => b.price - a.price);
  if (sort === "name") selected.sort((a, b) => a.name.localeCompare(b.name));
  grid.innerHTML = selected.map((product) => `
    <article class="product-card" data-product="${product.id}" tabindex="0" aria-label="View ${escapeHtml(product.name)}">
      <div class="product-image-wrap">
        <button class="product-view" type="button" aria-label="View details for ${escapeHtml(product.name)}">
          <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        </button>
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
        <button class="quick-add" type="button" data-add="${product.id}">Add to bag <span aria-hidden="true">+</span></button>
      </div>
      <div class="product-info">
        <div><h3 class="product-name">${escapeHtml(product.name)}</h3><p class="product-category">${escapeHtml(product.category)}</p></div>
        <p class="product-price">${money(product.price)}</p>
      </div>
    </article>
  `).join("");
  $("#empty-state").textContent = searchTerm
    ? `No products found for “${$("#product-search").value.trim()}”. Try another search or clear your filters.`
    : "No products match these filters. Try changing your selection.";
  $("#empty-state").hidden = selected.length > 0;
  $("#clear-search").hidden = !searchTerm;
  const filterCount = Number(activeFilter !== "All")
    + Number(priceRange !== "all")
    + Number(inStockOnly);
  $("#filter-count").textContent = filterCount;
  $("#filter-count").hidden = filterCount === 0;
  $("#all-count").textContent = String(products.length).padStart(2, "0");
  document.querySelectorAll("[data-category-count]").forEach((label) => {
    const count = products.filter((product) => product.category === label.dataset.categoryCount).length;
    label.textContent = `${count} ${count === 1 ? "piece" : "pieces"}`;
  });
  grid.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.closest(".product-image-wrap").classList.add("image-fallback");
    }, { once: true });
  });
}

function setCategoryFilter(category) {
  activeFilter = category;
  $("#category-filter").value = category;
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === category);
  });
  renderProducts();
}

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) || "{}");
    return {
      density: saved.density === "compact" ? "compact" : "comfortable",
      showCategories: saved.showCategories !== false
    };
  } catch {
    return { density: "comfortable", showCategories: true };
  }
}

function applyPreferences(preferences) {
  document.body.classList.toggle("compact-products", preferences.density === "compact");
  document.body.classList.toggle("hide-product-categories", !preferences.showCategories);
  $("#product-density").value = preferences.density;
  $("#show-categories").checked = preferences.showCategories;
}

function savePreferences() {
  const preferences = {
    density: $("#product-density").value,
    showCategories: $("#show-categories").checked
  };
  localStorage.setItem(preferencesKey, JSON.stringify(preferences));
  applyPreferences(preferences);
}

function addToCart(productId) {
  const product = products.find((item) => item.id === Number(productId));
  if (!product) return;
  const item = cart.find((entry) => entry.id === product.id);
  if (item && item.quantity >= 20) {
    showToast("You can add up to 20 of each item.");
    return;
  }
  if (item) item.quantity += 1;
  else cart.push({ id: product.id, quantity: 1 });
  saveCart();
  showToast(`${product.name} added to your bag.`);
}

function renderCart() {
  cart.forEach((item, index) => {
    if (!products.some((product) => product.id === item.id)) cart.splice(index, 1);
  });
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  $("#cart-count").textContent = count;
  $("#drawer-count").textContent = count ? `(${count})` : "";
  $("#cart-subtotal").textContent = money(total);
  $("#shipping-note").textContent = total >= 5000
    ? "Lovely — your order ships free."
    : total > 0
      ? `${money(5000 - total)} away from complimentary shipping.`
      : "";

  if (cart.length === 0) {
    $("#cart-items").innerHTML = '<div class="cart-empty"><strong>Your bag feels light.</strong><span>Find a few things to make it feel like you.</span></div>';
  } else {
    $("#cart-items").innerHTML = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) return "";
      return `
        <article class="cart-line">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
          <div><h3>${escapeHtml(product.name)}</h3><p>${money(product.price)}</p>
            <div class="quantity-control">
              <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Remove one ${escapeHtml(product.name)}">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Add one ${escapeHtml(product.name)}">+</button>
            </div>
          </div>
          <div class="cart-line-price">${money(product.price * item.quantity)}<br>
            <button type="button" class="remove-item" data-remove="${product.id}">Remove</button>
          </div>
        </article>`;
    }).join("");
    $("#cart-items").querySelectorAll("img").forEach((image) => {
      image.addEventListener("error", () => { image.style.visibility = "hidden"; }, { once: true });
    });
  }
  $("#checkout-button").disabled = cart.length === 0;
  $("#checkout-button").style.opacity = cart.length === 0 ? ".45" : "1";
}

function openCart() {
  $("#overlay").hidden = false;
  requestAnimationFrame(() => {
    $("#overlay").classList.add("visible");
    $("#cart-drawer").classList.add("open");
    $("#cart-drawer").setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  });
}

function closeCart() {
  $("#overlay").classList.remove("visible");
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  setTimeout(() => { $("#overlay").hidden = true; }, 250);
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
  document.body.classList.remove("modal-open");
}

function showProduct(product) {
  $("#detail-content").innerHTML = `
    <div class="detail-layout">
      <div class="detail-image-wrap">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        <span class="image-fallback-label">Product image unavailable</span>
      </div>
      <div class="detail-copy">
        <span class="eyebrow">${escapeHtml(product.category)}${product.badge ? ` · ${escapeHtml(product.badge)}` : ""}</span>
        <h2>${escapeHtml(product.name)}</h2>
        <p class="detail-price">${money(product.price)}</p>
        <p>${escapeHtml(product.description)}</p>
        <p class="detail-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}">${product.stock > 0 ? `${product.stock} in stock` : "Currently out of stock"}</p>
        <button class="button button-dark detail-add" type="button" data-add="${product.id}">Add to bag <span>${money(product.price)}</span></button>
      </div>
    </div>`;
  const image = $("#detail-content img");
  image.addEventListener("error", () => {
    image.closest(".detail-image-wrap").classList.add("image-fallback");
  }, { once: true });
  openDialog($("#detail-dialog"));
}

function accountForm(mode = "login", message = "") {
  const registering = mode === "register";
  $("#account-content").innerHTML = `
    <span class="eyebrow">A little more personal</span>
    <h2>${registering ? "Make yourself at home." : "Welcome back."}</h2>
    <p>${registering ? "Create an account to keep your orders and good things together." : "Sign in to pick up where you left off."}</p>
    <form id="account-form" data-mode="${mode}">
      ${registering ? '<label class="form-field"><span>Your name</span><input name="name" autocomplete="name" required minlength="2" maxlength="80"></label>' : ""}
      <label class="form-field"><span>Email address</span><input name="email" type="email" autocomplete="email" required></label>
      <label class="form-field"><span>Password</span><input name="password" type="password" autocomplete="${registering ? "new-password" : "current-password"}" minlength="${registering ? 8 : 1}" maxlength="72" required></label>
      <button class="button button-dark form-submit" type="submit">${registering ? "Create account" : "Sign in"} <span aria-hidden="true">↗</span></button>
      <p class="form-error" id="account-error" aria-live="polite">${escapeHtml(message)}</p>
    </form>
    <p class="form-switch">${registering ? "Already have an account?" : "New around here?"}
      <button type="button" id="account-switch">${registering ? "Sign in" : "Create an account"}</button>
    </p>`;
  $("#account-switch").addEventListener("click", () => accountForm(registering ? "login" : "register"));
  $("#account-form").addEventListener("submit", submitAccount);
}

async function showAccount() {
  if (!currentUser) {
    accountForm();
    openDialog($("#account-dialog"));
    return;
  }
  const content = $("#account-content");
  content.innerHTML = `
    <span class="eyebrow">Your E-Shop account</span>
    <h2>Good to see you.</h2>
    <div class="account-summary"><span class="avatar">${escapeHtml(currentUser.name.charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(currentUser.name)}</strong><small>${escapeHtml(currentUser.email)}</small></div></div>
    <div class="order-list"><h3>Your orders</h3><div id="account-orders">Loading your orders…</div></div>
    <button class="account-logout" id="logout-button" type="button">Sign out</button>`;
  openDialog($("#account-dialog"));
  $("#logout-button").addEventListener("click", async () => {
    try {
      await request("/api/auth/logout", { method: "POST", body: "{}" });
      currentUser = null;
      updateAccountLabel();
      closeDialog($("#account-dialog"));
      showToast("You have been signed out.");
    } catch (error) {
      showToast(error.message);
    }
  });
  try {
    const { orders } = await request("/api/orders");
    $("#account-orders").innerHTML = orders.length ? orders.map((order) => `
      <div class="order-row"><span>Order #${order.id} · ${escapeHtml(order.status)}</span><span>${money(order.total)}</span></div>
    `).join("") : '<p class="product-category">Your first order will feel right at home here.</p>';
  } catch (error) {
    $("#account-orders").textContent = error.message;
  }
}

function updateAccountLabel() {
  $("#account-label").textContent = currentUser ? currentUser.name.split(" ")[0] : "Account";
  $("#account-button").setAttribute("aria-label", currentUser ? `Account for ${currentUser.name}` : "Sign in");
}

async function submitAccount(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const mode = form.dataset.mode;
  const fields = Object.fromEntries(new FormData(form).entries());
  const errorSlot = $("#account-error");
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  errorSlot.textContent = "";
  try {
    const { user } = await request(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(fields)
    });
    currentUser = user;
    updateAccountLabel();
    closeDialog($("#account-dialog"));
    showToast(`Welcome${mode === "register" ? " to E-Shop" : " back"}, ${user.name.split(" ")[0]}.`);
    if (cart.length) openCheckout();
  } catch (error) {
    errorSlot.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
}

function openCheckout() {
  if (!cart.length) return;
  if (!currentUser) {
    closeCart();
    accountForm("login", "Sign in or create an account to place your order.");
    openDialog($("#account-dialog"));
    return;
  }
  closeCart();
  const total = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  $("#checkout-content").innerHTML = `
    <span class="eyebrow">Almost yours</span>
    <h2>Where should we send it?</h2>
    <p>Your good things are one thoughtful delivery away.</p>
    <form id="checkout-form">
      <label class="form-field"><span>Recipient name</span><input name="shippingName" autocomplete="name" value="${escapeHtml(currentUser.name)}" required minlength="2" maxlength="100"></label>
      <label class="form-field"><span>Shipping address</span><textarea name="shippingAddress" autocomplete="street-address" placeholder="Street, city, state and PIN code" required minlength="8" maxlength="300"></textarea></label>
      <div class="checkout-summary">${cart.map((item) => {
        const product = products.find((entry) => entry.id === item.id);
        return product ? `<div class="checkout-summary-row"><span>${escapeHtml(product.name)} × ${item.quantity}</span><span>${money(product.price * item.quantity)}</span></div>` : "";
      }).join("")}
        <div class="checkout-summary-row total"><span>Total</span><strong>${money(total)}</strong></div>
      </div>
      <button class="button button-dark form-submit" type="submit">Place order <span>${money(total)}</span></button>
      <p class="form-error" id="checkout-error" aria-live="polite"></p>
    </form>`;
  $("#checkout-form").addEventListener("submit", submitOrder);
  openDialog($("#checkout-dialog"));
}

async function submitOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const errorSlot = $("#checkout-error");
  submit.disabled = true;
  errorSlot.textContent = "";
  try {
    const fields = Object.fromEntries(new FormData(form).entries());
    const { order } = await request("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        ...fields,
        items: cart.map((item) => ({ id: item.id, quantity: item.quantity }))
      })
    });
    cart.splice(0, cart.length);
    saveCart();
    closeDialog($("#checkout-dialog"));
    showToast(`Order #${order.id} is in good hands. Thank you!`);
  } catch (error) {
    errorSlot.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    event.stopPropagation();
    addToCart(addButton.dataset.add);
    if (addButton.closest(".detail-dialog")) closeDialog($("#detail-dialog"));
    return;
  }
  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const productId = Number(quantityButton.dataset.quantity);
    const item = cart.find((entry) => entry.id === productId);
    if (!item) return;
    const next = item.quantity + Number(quantityButton.dataset.change);
    if (next < 1) cart.splice(cart.indexOf(item), 1);
    else if (next <= 20) item.quantity = next;
    saveCart();
    return;
  }
  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    const index = cart.findIndex((item) => item.id === Number(removeButton.dataset.remove));
    if (index >= 0) cart.splice(index, 1);
    saveCart();
    return;
  }
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    setCategoryFilter(filterButton.dataset.filter);
  }
  const categoryLink = event.target.closest("[data-filter-link]");
  if (categoryLink) {
    setCategoryFilter(categoryLink.dataset.filterLink);
  }
});

$("#carousel-previous").addEventListener("click", () => {
  showCarouselSlide(carouselIndex - 1);
  startCarousel();
});
$("#carousel-next").addEventListener("click", () => {
  showCarouselSlide(carouselIndex + 1);
  startCarousel();
});
document.querySelectorAll("[data-carousel-slide]").forEach((dot) => {
  dot.addEventListener("click", () => {
    showCarouselSlide(Number(dot.dataset.carouselSlide));
    startCarousel();
  });
});
$("#hero-carousel").addEventListener("pointerenter", stopCarousel);
$("#hero-carousel").addEventListener("pointerleave", startCarousel);
$("#hero-carousel").addEventListener("focusin", stopCarousel);
$("#hero-carousel").addEventListener("focusout", (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) startCarousel();
});
document.addEventListener("visibilitychange", startCarousel);

grid.addEventListener("click", (event) => {
  if (event.target.closest("[data-add]")) return;
  const card = event.target.closest("[data-product]");
  if (card) showProduct(products.find((product) => product.id === Number(card.dataset.product)));
});
grid.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-product]")) {
    event.preventDefault();
    showProduct(products.find((product) => product.id === Number(event.target.dataset.product)));
  }
});
$("#sort-select").addEventListener("change", renderProducts);
$("#product-search").addEventListener("input", renderProducts);
$("#clear-search").addEventListener("click", () => {
  $("#product-search").value = "";
  $("#product-search").focus();
  renderProducts();
});
$("#filter-toggle").addEventListener("click", () => {
  const panel = $("#filter-panel");
  const expanded = $("#filter-toggle").getAttribute("aria-expanded") === "true";
  $("#filter-toggle").setAttribute("aria-expanded", String(!expanded));
  panel.hidden = expanded;
});
$("#category-filter").addEventListener("change", (event) => setCategoryFilter(event.target.value));
$("#price-filter").addEventListener("change", renderProducts);
$("#availability-filter").addEventListener("change", renderProducts);
$("#clear-filters").addEventListener("click", () => {
  $("#price-filter").value = "all";
  $("#availability-filter").value = "all";
  setCategoryFilter("All");
});
$("#settings-button").addEventListener("click", () => openDialog($("#settings-dialog")));
$("#product-density").addEventListener("change", savePreferences);
$("#show-categories").addEventListener("change", savePreferences);
$("#reset-settings").addEventListener("click", () => {
  const defaults = { density: "comfortable", showCategories: true };
  localStorage.setItem(preferencesKey, JSON.stringify(defaults));
  applyPreferences(defaults);
});
$("#cart-button").addEventListener("click", openCart);
$("#account-button").addEventListener("click", showAccount);
$("#overlay").addEventListener("click", closeCart);
$("#checkout-button").addEventListener("click", openCheckout);
document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = button.closest("dialog");
    if (dialog) closeDialog(dialog);
    else closeCart();
  });
});
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));
});
$("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  $("#newsletter-message").textContent = "You're on the list. We'll be in touch, thoughtfully.";
  $("#newsletter-email").value = "";
});

async function start() {
  try {
    applyPreferences(readPreferences());
    showCarouselSlide(0);
    startCarousel();
    products = await request("/api/products");
    renderProducts();
    renderCart();
    const { user } = await request("/api/auth/me");
    currentUser = user;
    updateAccountLabel();
  } catch (error) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

start();
