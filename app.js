const API =
  "https://upnuuqoccdnwzgkrugto.supabase.co/functions/v1/storefront-api";

let catalog = [];
let cart = {};

const $ = (id) => document.getElementById(id);
const money = (n) => `₹${Number(n).toFixed(0)}`;

async function loadCatalog() {
  const response = await fetch(`${API}?merchant=raju`, {
    headers: { Accept: "application/json" }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not load inventory");
  }

  catalog = data.items || [];

  if ($("shop")) {
    $("shop").textContent =
      data.merchant?.name || "Raju Fresh Vegetables";
  }

  renderItems();
  renderCart();
}

function renderItems() {
  const el = $("items");
  if (!el) return;

  el.innerHTML = catalog
    .map(
      (item) => `
      <div class="row">
        <div>
          <b>${item.name}</b>
          <div class="muted">
            ${money(item.price)} / ${item.unit} · ${item.qty} available
          </div>
        </div>

        <input
          class="qty"
          type="number"
          min="0"
          max="${item.qty}"
          step="${item.unit === "kg" ? "0.25" : "1"}"
          value="${cart[item.id] || 0}"
          data-id="${item.id}"
        >
      </div>
    `
    )
    .join("");

  el.querySelectorAll("[data-id]").forEach((input) => {
    input.addEventListener("change", (event) => {
      setQty(event.target.dataset.id, event.target.value);
    });
  });
}

function setQty(id, value) {
  const item = catalog.find((x) => x.id === id);

  let quantity = Number(value) || 0;

  if (item) {
    quantity = Math.min(quantity, Number(item.qty));
  }

  if (quantity > 0) {
    cart[id] = quantity;
  } else {
    delete cart[id];
  }

  renderCart();
}

function renderCart() {
  const cartEl = $("cart");
  const totalEl = $("total");

  if (!cartEl || !totalEl) return;

  let total = 0;

  const rows = Object.entries(cart).map(([id, quantity]) => {
    const item = catalog.find((x) => x.id === id);

    if (!item) return "";

    const subtotal = Number(item.price) * quantity;
    total += subtotal;

    return `
      <div class="row">
        <span>${item.name} × ${quantity} ${item.unit}</span>
        <b>${money(subtotal)}</b>
      </div>
    `;
  });

  cartEl.innerHTML =
    rows.join("") || '<span class="muted">Nothing added yet.</span>';

  totalEl.textContent = money(total);
}

async function placeOrder() {
  const msg = $("msg");

  const name = $("name")?.value.trim();
  const phone = $("phone")?.value.trim();
  const address = $("address")?.value.trim();
  const payment = $("payment")?.value || "cod";

  if (!name || !phone || !address) {
    if (msg) {
      msg.textContent = "Please add name, mobile and address.";
    }
    return;
  }

  if (!Object.keys(cart).length) {
    if (msg) {
      msg.textContent = "Please add at least one item.";
    }
    return;
  }

  if (msg) {
    msg.textContent = "Placing order…";
  }

  try {
    const response = await fetch(API, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        action: "order",
        merchant_slug: "raju",
        name,
        phone,
        address,
        payment_method: payment,
        source: "web",

        items: Object.entries(cart).map(
          ([product_id, quantity]) => ({
            product_id,
            quantity
          })
        )
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not place order");
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (msg) {
      msg.textContent =
        `Order #${result?.order_number || "confirmed"} confirmed`;
    }

    cart = {};

    await loadCatalog();

  } catch (error) {
    if (msg) {
      msg.textContent =
        error.message || "Could not place order.";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("placeOrder")?.addEventListener("click", placeOrder);

  loadCatalog().catch((error) => {
    if ($("items")) {
      $("items").innerHTML =
        `<span class="muted">${error.message}</span>`;
    }
  });
});
