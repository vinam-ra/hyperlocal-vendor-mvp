const API = "https://upnuuqoccdnwzgkrugto.supabase.co/functions/v1/storefront-api";

let catalog = [];
let cart = {};

const $ = (id) => document.getElementById(id);
const money = (n) => `₹${Number(n).toFixed(0)}`;

async function loadCatalog() {
  const response = await fetch(`${API}?merchant=raju`, {
    headers: { Accept: "application/json" }
  });

  const data = await response.json();

  if (!response.ok)
    throw new Error(data.error || "Could not load inventory");

  catalog = data.items || [];

  renderItems();
  renderCart();
}

function renderItems() {
  const el = $("items");
  if (!el) return;

  el.innerHTML = catalog.map((item) => `
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
  `).join("");

  el.querySelectorAll("[data-id]").forEach((input) => {
    input.addEventListener("change", (e) => {
      setQty(e.target.dataset.id, e.target.value);
    });
  });
}

function setQty(id, value) {
  const item = catalog.find((x) => x.id === id);

  let quantity = Number(value) || 0;

  if (item)
    quantity = Math.min(quantity, Number(item.qty));

  if (quantity > 0)
    cart[id] = quantity;
  else
    delete cart[id];

  renderCart();
}

function renderCart() {
  const cartEl = $("cartbox");
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

  cartEl.innerHTML = rows.join("") || "Nothing added yet.";

  cartEl.classList.toggle("muted", rows.length === 0);

  totalEl.textContent = money(total);
}

function parseTyped() {
  const typed = $("typed");
  if (!typed) return;

  const text = typed.value.toLowerCase();

  catalog.forEach((item) => {
    const names = [
      item.name,
      ...(item.aliases || [])
    ].map((x) => String(x).toLowerCase());

    for (const name of names) {
      const pos = text.indexOf(name);

      if (pos < 0) continue;

      const before =
        text.slice(Math.max(0, pos - 25), pos);

      const match =
        before.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|g|gram)?\s*$/);

      let quantity =
        match ? Number(match[1]) : 1;

      if (
        match &&
        ["g", "gram"].includes(match[2])
      ) {
        quantity /= 1000;
      }

      cart[item.id] =
        Math.min(quantity, Number(item.qty));

      break;
    }
  });

  renderItems();
  renderCart();
}

function normalizePayment(value) {
  return String(value || "")
    .toLowerCase()
    .includes("upi")
      ? "upi"
      : "cod";
}

async function placeOrder() {
  const msg = $("msg");

  const name =
    $("name")?.value.trim();

  const phone =
    $("phone")?.value.trim();

  const address =
    $("address")?.value.trim();

  if (!name || !phone || !address) {
    if (msg)
      msg.textContent =
        "Please add name, mobile and address.";

    return;
  }

  if (!Object.keys(cart).length) {
    if (msg)
      msg.textContent =
        "Please add at least one item.";

    return;
  }

  if (msg)
    msg.textContent = "Placing order…";

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

        payment_method:
          normalizePayment(
            $("payment")?.value
          ),

        source:
          $("typed")?.value.trim()
            ? "typed"
            : "web",

        items:
          Object.entries(cart).map(
            ([product_id, quantity]) => ({
              product_id,
              quantity
            })
          )
      })
    });

    const data =
      await response.json();

    if (!response.ok)
      throw new Error(
        data.error ||
        "Could not place order"
      );

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (msg)
      msg.textContent =
        `Order #${result?.order_number || "confirmed"} confirmed`;

    cart = {};

    if ($("typed"))
      $("typed").value = "";

    await loadCatalog();

  } catch (error) {
    if (msg)
      msg.textContent =
        error.message ||
        "Could not place order.";
  }
}

window.parseTyped = parseTyped;
window.placeOrder = placeOrder;

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadCatalog().catch((error) => {
      if ($("items"))
        $("items").innerHTML =
          `<span class="muted">${error.message}</span>`;
    });
  }
);
