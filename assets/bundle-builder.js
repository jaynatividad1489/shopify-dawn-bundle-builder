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

  async addBundleToCart() {
    const items = [];

    this.products.forEach((product) => {
      const select = product.querySelector(
        "[data-variant-select]"
      );

      if (select) {
        items.push({
          id: Number(select.value),
          quantity: 1
        });

        return;
      }

      const input = product.querySelector(
        "[data-variant-id]"
      );

      if (input) {
        items.push({
          id: Number(input.value),
          quantity: 1
        });
      }
    });

    if (!items.length) {
      this.showMessage(
        "Please select at least one product.",
        "error"
      );
      return;
    }

    this.button.disabled = true;
    this.button.classList.add("loading");

    const originalText = this.button.textContent;
    this.button.textContent = "Adding...";

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          items
        })
      });

      if (!response.ok) {
        throw new Error(
          "Unable to add bundle to cart."
        );
      }

      await response.json();

      this.showMessage(
        "Bundle added to cart!",
        "success"
      );

      document.dispatchEvent(
        new CustomEvent("cart:refresh", {
          bubbles: true
        })
      );

      document.dispatchEvent(
        new CustomEvent("cart:open", {
          bubbles: true
        })
      );

    } catch (error) {

      console.error(error);

      this.showMessage(
        error.message,
        "error"
      );

    } finally {

      this.button.disabled = false;
      this.button.classList.remove("loading");
      this.button.textContent = originalText;

    }
  }

  showMessage(message, type = "success") {

    if (!this.messageElement) return;

    this.messageElement.hidden = false;

    this.messageElement.textContent = message;

    this.messageElement.className =
      "bundle-builder__message";

    this.messageElement.classList.add(
      `bundle-builder__message--${type}`
    );

    clearTimeout(this.messageTimeout);

    this.messageTimeout = setTimeout(() => {

      this.messageElement.hidden = true;

    }, 4000);

  }

}

document.addEventListener("DOMContentLoaded", () => {

  const sections = document.querySelectorAll(
    ".bundle-builder"
  );

  sections.forEach((section) => {

    new BundleBuilder(section);

  });

});
