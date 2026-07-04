/**
 * Bundle Builder
 * Shopify Dawn Compatible
 * Version 1.0.0
 */

class BundleBuilder {
  constructor(container) {
    this.container = container;

    this.discount = Number(
      container.dataset.discount || 0
    );

    this.products = [
      ...container.querySelectorAll("[data-bundle-product]")
    ];

    this.subtotalElement =
      container.querySelector("[data-bundle-subtotal]");

    this.discountElement =
      container.querySelector("[data-bundle-discount]");

    this.totalElement =
      container.querySelector("[data-bundle-total]");

    this.messageElement =
      container.querySelector("[data-bundle-message]");

    this.button =
      container.querySelector("[data-add-bundle]");

    this.moneyFormatter = new Intl.NumberFormat(
      document.documentElement.lang || "en",
      {
        style: "currency",
        currency:
          window.Shopify?.currency?.active ||
          window.Shopify?.currency?.default ||
          "USD"
      }
    );

    this.init();
  }

  init() {
    this.bindEvents();
    this.calculateTotals();
  }

  bindEvents() {
    this.products.forEach((product) => {
      const select = product.querySelector(
        "[data-variant-select]"
      );

      if (!select) return;

      select.addEventListener("change", () => {
        this.updateVariant(product, select);
        this.calculateTotals();
      });
    });

    if (this.button) {
      this.button.addEventListener("click", () => {
        this.addBundleToCart();
      });
    }
  }

  updateVariant(product, select) {
    const option =
      select.options[select.selectedIndex];

    const price = Number(
      option.dataset.price || 0
    );

    const available =
      option.dataset.available === "true";

    const priceDisplay = product.querySelector(
      "[data-price-display]"
    );

    if (priceDisplay) {
      priceDisplay.textContent =
        this.formatMoney(price);
    }

    const inventory = product.querySelector(
      "[data-inventory-message]"
    );

    if (inventory) {
      inventory.textContent = available
        ? "In stock"
        : "Sold Out";
    }
  }

  calculateTotals() {
    let subtotal = 0;

    this.products.forEach((product) => {
      const select = product.querySelector(
        "[data-variant-select]"
      );

      if (select) {
        const option =
          select.options[select.selectedIndex];

        subtotal += Number(
          option.dataset.price || 0
        );

        return;
      }

      const price = product.querySelector(
        "[data-price]"
      );

      if (price) {
        subtotal += Number(
          price.dataset.price || 0
        );
      }
    });

    const discountAmount =
      subtotal * (this.discount / 100);

    const total =
      subtotal - discountAmount;

    this.subtotalElement.textContent =
      this.formatMoney(subtotal);

    this.discountElement.textContent =
      "-" + this.formatMoney(discountAmount);

    this.totalElement.textContent =
      this.formatMoney(total);
  }

  formatMoney(cents) {
    return this.moneyFormatter.format(
      cents / 100
    );
  }
