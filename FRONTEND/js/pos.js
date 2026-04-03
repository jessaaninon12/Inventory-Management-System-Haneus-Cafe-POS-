/* ================================================================
   pos.js — Point of Sale functionality embedded in dashboard.html

   Features:
   • Product grid with category / search filtering
   • Cart management with quantity controls
   • Exclusive 12% VAT + PWD/Senior discount
   • POST /api/sales/create/ on checkout
   • Receipt modal (printable / downloadable) after every sale
   • Order History floating panel (GET /api/sales/view/)
================================================================ */

"use strict";

// ── Constants ─────────────────────────────────────────────────
const POS_API  = "http://127.0.0.1:8000/api";
const TAX_RATE = 0.12;   // 12% VAT exclusive

// ── State ─────────────────────────────────────────────────────────
let posCart        = [];
let posCurrentCat  = "all";
let posProducts    = [];
let _lastSaleData  = null;   // stores the last saved sale from the API
let _posOrderCounter = 0;    // auto-increment order counter

// ── View Toggle ────────────────────────────────────────────────────

/**
 * Called by the Dashboard / Point of Sale toggle buttons.
 * @param {'dashboard'|'pos'} view
 */
function switchView(view) {
    const dashSection = document.getElementById("dashboard-section");
    const posSection  = document.getElementById("pos-section");
    const btnDash     = document.getElementById("btn-dashboard");
    const btnPos      = document.getElementById("btn-pos");

    if (view === "pos") {
        dashSection.style.display = "none";
        posSection.style.display  = "block";
        btnDash.classList.remove("active");
        btnPos.classList.add("active");
        // Lazy-init POS the first time it is opened
        if (posProducts.length === 0) initPOS();
        else renderPOSProducts();
    } else {
        posSection.style.display  = "none";
        dashSection.style.display = "block";
        btnPos.classList.remove("active");
        btnDash.classList.add("active");
        // Re-create lucide icons in case any were added by POS
        if (window.lucide) lucide.createIcons();
    }
}

// ── Init ─────────────────────────────────────────────────────────

async function initPOS() {
    updatePOSDateDisplay();
    await _initOrderCounter();
    updatePOSReceiptLabel();
    updatePOSOrderLabel();
    setupPOSCategoryTabs();
    setupPOSSearch();
    setupPOSButtons();
    fetchPOSProducts();
}

/** Fetch last sale to determine next order number */
async function _initOrderCounter() {
    try {
        const res = await fetch(`${POS_API}/sales/view/?page=1&limit=1`);
        if (res.ok) {
            const data = await res.json();
            const sales = data.sales || data.results || [];
            if (sales.length > 0) {
                // Extract the numeric suffix from the last sale_id (e.g. SALE-20260403-0005 → 5)
                const lastId = sales[0].sale_id || sales[0].receipt_number || '';
                const match = lastId.match(/(\d+)$/);
                _posOrderCounter = match ? parseInt(match[1], 10) : 0;
            }
        }
    } catch (e) { console.warn('Could not fetch last order number:', e); }
}

function updatePOSDateDisplay() {
    const el = document.getElementById("pos-date-display");
    if (!el) return;
    el.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
}

/** Show the next receipt number (auto-incremented). */
function updatePOSReceiptLabel() {
    const el = document.getElementById("pos-receipt-number");
    if (!el) return;
    const now     = new Date();
    const dateStr = now.getFullYear().toString()
                  + String(now.getMonth() + 1).padStart(2, "0")
                  + String(now.getDate()).padStart(2, "0");
    const nextNum = String(_posOrderCounter + 1).padStart(4, "0");
    el.textContent = `REC-${dateStr}-${nextNum}`;
}

/** Update the Order # display across all POS elements */
function updatePOSOrderLabel() {
    const nextOrder = String(_posOrderCounter + 1).padStart(5, "0");
    const orderStr = `#${nextOrder}`;
    const ids = ['pos-receipt-no-display', 'cash-modal-order-num', 'gcash-modal-order-num'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = orderStr;
    });
}

// ── Category tabs ─────────────────────────────────────────────────

function setupPOSCategoryTabs() {
    document.querySelectorAll(".pos-cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pos-cat-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            posCurrentCat = btn.dataset.category;
            renderPOSProducts();
        });
    });
}

// ── Search ────────────────────────────────────────────────────────

function setupPOSSearch() {
    const input = document.getElementById("pos-search");
    if (!input) return;
    input.addEventListener("input", renderPOSProducts);
}

// ── Buttons ───────────────────────────────────────────────────────

function setupPOSButtons() {
    const clearBtn    = document.getElementById("pos-clear-btn");
    const cancelBtn   = document.getElementById("pos-cancel-btn");
    const checkoutBtn = document.getElementById("pos-checkout-btn");
    const paySelect   = document.getElementById("pos-payment-method");
    const cashInput   = document.getElementById("pos-cash-tendered");

    function resetDiscount() {
        const d = document.getElementById("pos-discount-select");
        if (d) { d.value = "0"; updatePOSTotals(); }
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (posCart.length === 0) return;
            showConfirmModal("Clear the current cart?", () => {
                posCart = [];
                updatePOSReceiptLabel();
                updatePOSCart();
                resetCashTendered();
                resetDiscount();
            });
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            if (posCart.length === 0) return;
            showConfirmModal("Cancel this order?", () => {
                posCart = [];
                updatePOSReceiptLabel();
                posCurrentCat = "all";
                document.querySelectorAll(".pos-cat-btn").forEach(b => b.classList.remove("active"));
                const allBtn = document.querySelector(".pos-cat-btn[data-category='all']");
                if (allBtn) allBtn.classList.add("active");
                renderPOSProducts();
                updatePOSCart();
                resetCashTendered();
                resetDiscount();
            });
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", posCheckout);
    }

    // Show/hide cash tendered row based on payment method
    if (paySelect) {
        paySelect.addEventListener("change", () => {
            const cashRow = document.getElementById("pos-cash-row");
            if (cashRow) {
                if (paySelect.value === "Cash") {
                    cashRow.classList.add("active");
                } else {
                    cashRow.classList.remove("active");
                    resetCashTendered();
                }
            }
        });
    }

    // Compute change as user types cash tendered
    if (cashInput) {
        cashInput.addEventListener("input", updateChangeDue);
    }

    // Dine In / Take Out toggle
    document.querySelectorAll(".pos-order-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".pos-order-type-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Discount select
    const discountSelect = document.getElementById("pos-discount-select");
    if (discountSelect) discountSelect.addEventListener("change", updatePOSTotals);
}

let _posProductsAbort = null;   // Request cancellation

async function fetchPOSProducts() {
    if (_posProductsAbort) _posProductsAbort.abort();
    _posProductsAbort = new AbortController();

    const grid = document.getElementById("pos-products-grid");
    try {
        const res = await fetch(`${POS_API}/products/?page=1&limit=200`, { signal: _posProductsAbort.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Handle paginated response format
        posProducts = data.products || (Array.isArray(data) ? data : (data.results || []));
        renderPOSProducts();
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("POS: failed to load products", err);
        if (grid) {
            grid.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;">Could not load products. Make sure the backend is running.</p>';
        }
    }
}

// ── Render Products Grid ──────────────────────────────────────────

function renderPOSProducts() {
    const grid = document.getElementById("pos-products-grid");
    if (!grid) return;

    const searchTerm = (document.getElementById("pos-search")?.value || "").toLowerCase();

    let filtered = posProducts.filter(p => {
        const matchCat    = posCurrentCat === "all" || p.category === posCurrentCat;
        const matchSearch = p.name.toLowerCase().includes(searchTerm);
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;grid-column:1/-1;">No products found.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const stock      = parseInt(p.stock) || 0;
        const canOrder   = p.can_order !== false; // API may return can_order: false for sold-out
        const outOfStock = stock <= 0 || !canOrder;
        const lowStock   = !outOfStock && stock < (parseInt(p.low_stock_threshold) || 10);
        const badgeCls   = outOfStock ? "out-of-stock" : lowStock ? "low-stock" : "available";
        const badgeTxt   = outOfStock ? "Sold Out"  : lowStock ? "Low Stock" : "In Stock";
        const badge      = `<span class="pos-stock-badge ${badgeCls}">${badgeTxt}</span>`;

        const emoji  = getCategoryEmoji(p.category);
        const price  = parseFloat(p.price) || 0;
        const visual = p.image_url
            ? `<img class="pos-product-img" src="${escHtml(p.image_url)}" alt="" loading="lazy"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='block'"/>
               <div class="pos-product-emoji" style="display:none">${emoji}</div>`
            : `<div class="pos-product-emoji">${emoji}</div>`;
        const addBtn = outOfStock ? 
            `<button class="pos-add-btn pos-add-btn-disabled" disabled title="Out of stock" onclick="event.stopPropagation();">×</button>` :
            `<button class="pos-add-btn"
                     onclick="event.stopPropagation();posAddToCart(${p.id},'${escStr(p.name)}',${price},${stock})"
                     title="Add to order">+</button>`;

        const supplierLine = p.supplier_name
            ? `<div class="pos-product-supplier">&#128230; ${escHtml(p.supplier_name)}</div>`
            : '';

        return `
            <div class="pos-product-card${outOfStock ? " out-of-stock" : ""}"
                 onclick="${outOfStock ? "" : `posAddToCart(${p.id},'${escStr(p.name)}',${price},${stock})`}">
                ${badge}
                ${visual}
                <div class="pos-product-name">${escHtml(p.name)}</div>
                <div class="pos-product-cat">${escHtml(p.category)}</div>
                ${supplierLine}
                <div class="pos-product-price">${formatPOS(price)}</div>
                ${addBtn}
            </div>`;
    }).join("");

    if (window.lucide) lucide.createIcons();
}

function getCategoryEmoji(cat) {
    const map = {
        Beverages:    "☕",
        Pastries:     "🥐",
        Desserts:     "🍰",
        Ingredients:  "🧂",
        Merchandise:  "🛍️",
    };
    return map[cat] || "🛒";
}

// ── Cart ──────────────────────────────────────────────────────────

function posAddToCart(productId, productName, price, stock) {
    // Check stock and can_order flag from API
    const product = posProducts.find(p => p.id === productId);
    if (!product || stock <= 0 || product.can_order === false) { 
        posToast("Product is out of stock", "error"); 
        return; 
    }

    const existing = posCart.find(i => i.id === productId);
    if (existing) {
        if (existing.quantity < stock) {
            existing.quantity++;
        } else {
            posToast("Cannot exceed available stock", "warning");
            return;
        }
    } else {
        posCart.push({ id: productId, name: productName, price, quantity: 1 });
    }
    updatePOSCart();
}

function posIncreaseQty(index) {
    const product = posProducts.find(p => p.id === posCart[index].id);
    const maxStock = product ? parseInt(product.stock) : Infinity;
    if (posCart[index].quantity < maxStock) {
        posCart[index].quantity++;
        updatePOSCart();
    }
}

function posDecreaseQty(index) {
    if (posCart[index].quantity > 1) {
        posCart[index].quantity--;
    } else {
        posCart.splice(index, 1);
    }
    updatePOSCart();
}

function posRemoveItem(index) {
    posCart.splice(index, 1);
    updatePOSCart();
}

function updatePOSCart() {
    const container = document.getElementById("pos-cart-items");
    if (!container) return;

    if (posCart.length === 0) {
        container.innerHTML = '<p class="pos-empty-order">No items added yet</p>';
    } else {
        container.innerHTML = posCart.map((item, i) => `
            <div class="pos-order-item">
                <div class="pos-order-item-info">
                    <div class="pos-order-item-name">${escHtml(item.name)}</div>
                    <div class="pos-order-item-meta">${formatPOS(item.price)} each</div>
                </div>
                <div class="pos-qty-ctrl">
                    <button class="pos-qty-btn" onclick="posDecreaseQty(${i})">−</button>
                    <span class="pos-qty-val">${item.quantity}</span>
                    <button class="pos-qty-btn" onclick="posIncreaseQty(${i})">+</button>
                </div>
                <span class="pos-item-price">${formatPOS(item.price * item.quantity)}</span>
                <button class="pos-remove-btn" onclick="posRemoveItem(${i})" title="Remove">✕</button>
            </div>`
        ).join("");
    }

    updatePOSTotals();
}

// ── Totals (exclusive VAT with discount) ─────────────────────────

function _calcTotals() {
    const subtotal     = posCart.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountRate = parseFloat(document.getElementById("pos-discount-select")?.value || "0");
    const discount     = subtotal * discountRate;
    const taxable      = subtotal - discount;
    const tax          = taxable * TAX_RATE;          // VAT on taxable only
    const total        = taxable + tax;               // subtotal - discount + VAT
    return { subtotal, discount, taxable, tax, total };
}

function updatePOSTotals() {
    const { subtotal, discount, tax, total } = _calcTotals();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("pos-subtotal",       formatPOS(subtotal));
    set("pos-discount",       discount > 0 ? "\u2212" + formatPOS(discount) : formatPOS(0));
    set("pos-tax",            formatPOS(tax));
    set("pos-total",          formatPOS(total));
    set("pos-checkout-total", formatPOS(total));

    updateChangeDue();
}

function updateChangeDue() {
    const { total } = _calcTotals();

    const cashInput = document.getElementById("pos-cash-tendered");
    const changEl   = document.getElementById("pos-change-due");
    if (!cashInput || !changEl) return;

    const tendered = parseFloat(cashInput.value) || 0;
    const change   = tendered - total;

    changEl.textContent = formatPOS(Math.max(change, 0));
    changEl.className   = change >= 0 ? "pos-change-positive" : "pos-change-negative";
    if (tendered > 0 && change < 0) {
        changEl.textContent = "⚠ Short " + formatPOS(Math.abs(change));
    }
}

function resetCashTendered() {
    const input  = document.getElementById("pos-cash-tendered");
    const changEl = document.getElementById("pos-change-due");
    const row    = document.getElementById("pos-cash-row");
    if (input)  { input.value = ""; }
    if (changEl){ changEl.textContent = "\u20B10.00"; changEl.className = "pos-change-positive"; }
    if (row)    { row.classList.remove("active"); }
    // Reset payment back to Cash visually
    const paySelect = document.getElementById("pos-payment-method");
    if (paySelect) paySelect.value = "Cash";
}

// ── Checkout ──────────────────────────────────────────────────────

async function posCheckout() {
    if (posCart.length === 0) { posToast("Cart is empty", "error"); return; }

    const paymentMethod = document.getElementById("pos-payment-method")?.value || "Cash";

    // Store checkout context for payment modals
    _posCheckoutContext = {
        customerName: document.getElementById("pos-customer-name")?.value.trim() || "Walk-in",
        tableNumber:  document.getElementById("pos-table-number")?.value || "",
        orderType:    document.querySelector(".pos-order-type-btn.active")?.dataset.type || "Dine In",
        cashierName:  _getCashierName(),
        ...(_calcTotals())
    };

    // Show appropriate payment modal based on method
    if (paymentMethod === "Cash") {
        await _generateCustomerNumber();
        showCashModal(_posCheckoutContext);
    } else if (paymentMethod === "GCash") {
        await _generateCustomerNumber();
        showGCashModal(_posCheckoutContext);
    } else {
        // Card, Maya, etc. — treat like GCash (no input needed)
        await _generateCustomerNumber();
        await _completeSale(paymentMethod, _posCheckoutContext);
    }
}

let _posCheckoutContext = {};
let _lastGeneratedCustomerNumber = "CUST-00001";

// ── Customer Number Generation ─────────────────────────────────

async function _generateCustomerNumber() {
    try {
        // Get latest customer number from orders
        const res = await fetch(`${POS_API}/sales/latest-customer-number/`);
        if (res.ok) {
            const data = await res.json();
            const last = data.customer_number || "CUST-00000";
            const num = parseInt(last.replace("CUST-", "")) || 0;
            _lastGeneratedCustomerNumber = "CUST-" + String(num + 1).padStart(5, "0");
        }
    } catch (err) {
        console.warn("Could not fetch latest customer number, using local increment:", err);
        const num = parseInt(_lastGeneratedCustomerNumber.replace("CUST-", "")) || 1;
        _lastGeneratedCustomerNumber = "CUST-" + String(num + 1).padStart(5, "0");
    }
}

// ── Cash Payment Modal ────────────────────────────────────

function showCashModal(ctx) {
    const modal = document.getElementById("cash-payment-modal");
    if (!modal) return;

    // Set order and customer number
    const orderNum = document.getElementById("cash-modal-order-num");
    if (orderNum) orderNum.textContent = "#00001";  // Placeholder

    const custNum = document.getElementById("cash-modal-customer-num");
    if (custNum) custNum.textContent = _lastGeneratedCustomerNumber;

    // Reset input
    const amountInput = document.getElementById("cash-modal-amount");
    if (amountInput) amountInput.value = "";

    // Show modal
    modal.classList.add("open");

    // Focus input
    setTimeout(() => amountInput?.focus(), 100);
}

function closeCashModal(e) {
    if (e && e.target !== document.getElementById("cash-payment-modal")) return;
    document.getElementById("cash-payment-modal")?.classList.remove("open");
}

function submitCashPayment() {
    const amountInput = document.getElementById("cash-modal-amount");
    const amount = parseFloat(amountInput?.value || 0);
    const total = _posCheckoutContext.total || 0;

    if (amount < total) {
        posToast("⚠ Insufficient payment", "error");
        return;
    }

    closeCashModal();
    _completeSale("Cash", _posCheckoutContext, amount);
}

// ── GCash Payment Modal ────────────────────────────────────

function showGCashModal(ctx) {
    const modal = document.getElementById("gcash-payment-modal");
    if (!modal) return;

    // Set order and customer number
    const orderNum = document.getElementById("gcash-modal-order-num");
    if (orderNum) orderNum.textContent = "#00001";  // Placeholder

    const custNum = document.getElementById("gcash-modal-customer-num");
    if (custNum) custNum.textContent = _lastGeneratedCustomerNumber;

    // Set amount
    const amountEl = document.getElementById("gcash-modal-amount");
    if (amountEl) amountEl.textContent = formatPOS(_posCheckoutContext.total || 0);

    // Generate QR code (placeholder for now — would integrate with QR library)
    const qrContainer = document.getElementById("gcash-modal-qr");
    if (qrContainer) {
        qrContainer.innerHTML = '<div style="padding:2rem;text-align:center;font-size:0.9rem;color:var(--mocha);">QR Code Placeholder<br/>(Integration with QR library needed)</div>';
    }

    // Show modal
    modal.classList.add("open");
}

function closeGCashModal(e) {
    if (e && e.target !== document.getElementById("gcash-payment-modal")) return;
    document.getElementById("gcash-payment-modal")?.classList.remove("open");
}

function submitGCashPayment() {
    closeGCashModal();
    _completeSale("GCash", _posCheckoutContext, _posCheckoutContext.total);
}

// ── Complete Sale (unified function) ─────────────────────────────

async function _completeSale(paymentMethod, ctx, amountTendered = ctx.total) {
    const { subtotal, discount, tax, total, customerName, tableNumber, orderType, cashierName } = ctx;
    const changeAmount = Math.max(amountTendered - total, 0);

    // Auto-increment sale_id
    _posOrderCounter++;
    const now     = new Date();
    const dateStr = now.getFullYear().toString()
                  + String(now.getMonth() + 1).padStart(2, "0")
                  + String(now.getDate()).padStart(2, "0");
    const saleId  = "SALE-" + dateStr + "-" + String(_posOrderCounter).padStart(4, "0");

    const payload = {
        sale_id:         saleId,
        customer_name:   customerName,
        customer_number: _lastGeneratedCustomerNumber,
        table_number:    tableNumber,
        order_type:      orderType,
        cashier_name:    cashierName,
        payment_method:  paymentMethod,
        subtotal:        subtotal.toFixed(2),
        discount:        discount.toFixed(2),
        tax:             tax.toFixed(2),
        total:           total.toFixed(2),
        amount_tendered: amountTendered.toFixed(2),
        change_amount:   changeAmount.toFixed(2),
        status:          "Completed",
        items: posCart.map(i => ({
            product_id:   i.id,
            product_name: i.name,
            quantity:     i.quantity,
            unit_price:   i.price.toFixed(2),
        })),
    };

    const btn = document.getElementById("pos-checkout-btn");
    if (btn) { btn.disabled = true; btn.querySelector("span").textContent = "Processing…"; }

    try {
        const res = await fetch(`${POS_API}/sales/create/`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.errors ? JSON.stringify(err.errors) : `HTTP ${res.status}`);
        }

        const savedSale = await res.json();
        _lastSaleData   = savedSale;

        // Show receipt modal with data from the server
        showReceiptModal(savedSale);

        // Reset cart
        posCart = [];
        updatePOSReceiptLabel();
        updatePOSOrderLabel();
        const nameEl = document.getElementById("pos-customer-name");
        if (nameEl) nameEl.value = "";
        updatePOSCart();
        resetCashTendered();
        const discountEl = document.getElementById("pos-discount-select");
        if (discountEl) { discountEl.value = "0"; updatePOSTotals(); }
        fetchPOSProducts();     // refresh stock counts

    } catch (err) {
        console.error("POS checkout failed:", err);
        posToast("Checkout failed: " + err.message, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            const sp = btn.querySelector("span");
            if (sp) sp.textContent = "Place Order";
        }
    }
}

// ── Receipt Modal ─────────────────────────────────────────────────

function showReceiptModal(sale) {
    const overlay = document.getElementById("receipt-modal-overlay");
    if (!overlay) return;

    _setRm("rm-receipt-num",  sale.receipt_number  || sale.sale_id || "—");
    _setRm("rm-customer-num", sale.customer_number || "—");
    _setRm("rm-date",         _formatReceiptDate(sale.created_at));
    _setRm("rm-cashier",      sale.cashier_name    || "—");
    _setRm("rm-order-type",   sale.order_type      || "—");

    const itemsEl = document.getElementById("rm-items");
    if (itemsEl) {
        itemsEl.innerHTML = (sale.items || []).map(item => {
            const label = `${item.quantity}x ${escHtml(item.product_name)}`;
            const total = formatPOS(parseFloat(item.subtotal || item.total || 0));
            return `<div class="receipt-item-row"><span>${label}</span><span>${total}</span></div>`;
        }).join("");
    }

    _setRm("rm-subtotal", formatPOS(parseFloat(sale.subtotal)  || 0));
    _setRm("rm-discount", formatPOS(parseFloat(sale.discount)  || 0));
    _setRm("rm-vat",      formatPOS(parseFloat(sale.tax)       || 0));
    _setRm("rm-total",    formatPOS(parseFloat(sale.total)     || 0));
    _setRm("rm-payment",  sale.payment_method  || "—");
    _setRm("rm-tendered", formatPOS(parseFloat(sale.amount_tendered) || 0));
    _setRm("rm-change",   formatPOS(parseFloat(sale.change_amount)   || 0));

    overlay.classList.add("open");
}

function _setRm(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function _formatReceiptDate(isoStr) {
    if (!isoStr) return new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
    try {
        return new Date(isoStr).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
    } catch { return isoStr; }
}

function closeReceiptModal(e) {
    if (e && e.target !== document.getElementById("receipt-modal-overlay")) return;
    document.getElementById("receipt-modal-overlay")?.classList.remove("open");
}

async function downloadReceiptPNG() {
    const element = document.getElementById("receipt-to-download");
    if (!element) {
        posToast("Receipt container not found", "error");
        return;
    }

    try {
        // Get receipt number for filename
        const receiptNum = document.getElementById("rm-receipt-num")?.textContent || "Receipt";
        const fileName = `${receiptNum.replace(/\s+/g, "-")}.png`;

        // Render receipt to canvas with HD quality settings
        const canvas = await html2canvas(element, {
            scale: 3,              // HD quality (3x scaling)
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
            allowTaint: true
        });

        // Convert canvas to PNG blob and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            posToast("Receipt downloaded successfully!", "success");
        }, "image/png");
    } catch (err) {
        console.error("Receipt download failed:", err);
        posToast("Failed to download receipt: " + err.message, "error");
    }
}

// ── Order History ─────────────────────────────────────────────────

async function openOrderHistory() {
    const overlay = document.getElementById("order-history-overlay");
    if (!overlay) return;
    overlay.classList.add("open");

    const listEl = document.getElementById("order-history-list");
    if (listEl) listEl.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;padding:1rem;">Loading…</p>';

    try {
        const res = await fetch(`${POS_API}/sales/view/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sales = await res.json();

        if (!sales.length) {
            if (listEl) listEl.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;padding:1rem;">No orders yet.</p>';
            return;
        }

        if (listEl) {
            listEl.innerHTML = sales.map(s => {
                const rec   = escHtml(s.receipt_number || s.sale_id || "#—");
                const dt    = s.created_at
                    ? new Date(s.created_at).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })
                    : "—";
                const total = formatPOS(parseFloat(s.total) || 0);
                return `
                <div class="oh-item" onclick="viewHistoryReceipt(${s.id})">
                    <div class="oh-item-info">
                        <div class="oh-item-rec">${rec}</div>
                        <div class="oh-item-date">${escHtml(dt)} · ${escHtml(s.customer_name || "Walk-in")}</div>
                    </div>
                    <div class="oh-item-total">${total}</div>
                </div>`;
            }).join("");
        }
    } catch (err) {
        console.error("Order history load failed:", err);
        if (listEl) listEl.innerHTML = `<p style="color:#b91c1c;font-size:0.875rem;padding:1rem;">Failed to load history.</p>`;
    }
}

async function viewHistoryReceipt(saleId) {
    closeOrderHistory();
    try {
        const res = await fetch(`${POS_API}/sales/view/${saleId}/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const sale = await res.json();
        showReceiptModal(sale);
    } catch (err) {
        posToast("Could not load receipt: " + err.message, "error");
    }
}

function closeOrderHistory(e) {
    if (e && e.target !== document.getElementById("order-history-overlay")) return;
    document.getElementById("order-history-overlay")?.classList.remove("open");
}

// ── Helpers ───────────────────────────────────────────────────────

function formatPOS(amount) {
    return "₱" + parseFloat(amount).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function escStr(str) {
    return String(str).replace(/'/g, "\\'");
}

function _getCashierName() {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return user.username || user.name || "Cashier";
    } catch { return "Cashier"; }
}

function posToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `pos-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = "posToastIn 0.25s ease reverse";
        setTimeout(() => toast.remove(), 260);
    }, 3200);
}

// ── Payment Modal Event Listeners ─────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    // Cash modal: submit on Enter key
    const cashInput = document.getElementById("cash-modal-amount");
    if (cashInput) {
        cashInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") submitCashPayment();
        });
    }

    // Cash modal: OK button
    const cashOkBtn = document.getElementById("cash-modal-ok-btn");
    if (cashOkBtn) {
        cashOkBtn.addEventListener("click", submitCashPayment);
    }

    // Cash modal: Cancel button
    const cashCancelBtn = document.getElementById("cash-modal-cancel-btn");
    if (cashCancelBtn) {
        cashCancelBtn.addEventListener("click", () => closeCashModal());
    }

    // GCash modal: Confirm button
    const gcashConfirmBtn = document.getElementById("gcash-modal-confirm-btn");
    if (gcashConfirmBtn) {
        gcashConfirmBtn.addEventListener("click", submitGCashPayment);
    }

    // GCash modal: Cancel button
    const gcashCancelBtn = document.getElementById("gcash-modal-cancel-btn");
    if (gcashCancelBtn) {
        gcashCancelBtn.addEventListener("click", () => closeGCashModal());
    }
});

// ── Modal Escape Key Handler ─────────────────────────────────────
// (Sidebar toggle is handled by sidebar-toggle.js which is loaded
//  separately on dashboard.html — no duplication needed here.)

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.getElementById("receipt-modal-overlay")?.classList.remove("open");
        document.getElementById("order-history-overlay")?.classList.remove("open");
        document.getElementById("cash-payment-modal")?.classList.remove("open");
        document.getElementById("gcash-payment-modal")?.classList.remove("open");
    }
});
