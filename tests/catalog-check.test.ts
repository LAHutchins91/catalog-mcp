import { describe, expect, it } from "vitest";
import { checkShoppingCopy, type CatalogProduct } from "../src/lib/catalog-check.js";

function product(overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "name">): CatalogProduct {
  return {
    sku: null,
    specs: [],
    price_amount: 189,
    price_currency: "USD",
    availability: "in_stock",
    quantity: null,
    status: "ACTIVE",
    ...overrides
  };
}

const coat = product({
  name: "Wool Coat",
  sku: "WC-1",
  specs: [
    { label: "material", value: "wool" },
    { label: "weight", value: "2 pounds" }
  ],
  price_amount: 189,
  price_currency: "USD",
  availability: "quantity",
  quantity: 3
});

describe("checkShoppingCopy", () => {
  it("approves ordinary copy that states no spec, price, or stock", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat is ready for cold mornings.",
      products: [coat]
    });
    expect(result.verdict).toBe("approved");
    expect(result.violations).toEqual([]);
  });

  it("approves the saved price, spec, and quantity", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat is made of wool, weighs 2 pounds, and costs $189. Only 3 left.",
      products: [coat]
    });
    expect(result.verdict).toBe("approved");
  });

  it("rejects an invented spec, price, and stock level", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat is made of cashmere and costs $120. Only 9 left.",
      products: [coat]
    });
    expect(result.verdict).toBe("rejected");
    expect(result.violations.map((item) => item.kind).sort()).toEqual([
      "unapproved_price",
      "unapproved_spec",
      "unapproved_stock"
    ]);
  });

  it("does not let another product's price cover a named product", () => {
    const scarf = product({ name: "Scarf", price_amount: 40, price_currency: "USD", availability: "in_stock" });
    const result = checkShoppingCopy({
      draft: "The Wool Coat is $40.",
      products: [coat, scarf]
    });
    expect(result.violations.map((item) => item.kind)).toContain("unapproved_price");
  });

  it("allows an unnamed price that an active product stores", () => {
    const result = checkShoppingCopy({
      draft: "One item in the shop is 189 dollars.",
      products: [coat, product({ name: "Scarf", price_amount: 40, price_currency: "USD" })]
    });
    expect(result.verdict).toBe("approved");
  });

  it("rejects a currency that the product does not use", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat is €189.",
      products: [coat]
    });
    expect(result.violations.map((item) => item.kind)).toContain("unapproved_price");
  });

  it("rejects in stock when the store approved a quantity", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat is in stock.",
      products: [coat]
    });
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_stock"]);
  });

  it("rejects a count when the store approved in stock without a quantity", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat has 3 left.",
      products: [product({ name: "Wool Coat", availability: "in_stock" })]
    });
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_stock"]);
  });

  it("approves out of stock only for that availability", () => {
    const approved = checkShoppingCopy({
      draft: "The Wool Coat is out of stock.",
      products: [product({ name: "Wool Coat", availability: "out_of_stock" })]
    });
    expect(approved.verdict).toBe("approved");

    const rejected = checkShoppingCopy({
      draft: "The Wool Coat is sold out.",
      products: [product({ name: "Wool Coat", availability: "in_stock" })]
    });
    expect(rejected.violations.map((item) => item.kind)).toEqual(["unapproved_stock"]);
  });

  it("rejects stock that is not tied to one product when several are active", () => {
    const result = checkShoppingCopy({
      draft: "Everything is in stock.",
      products: [coat, product({ name: "Scarf", availability: "in_stock" })]
    });
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_stock"]);
  });

  it("attributes stock to the only active product", () => {
    const result = checkShoppingCopy({
      draft: "Available now.",
      products: [product({ name: "Wool Coat", availability: "in_stock" })]
    });
    expect(result.verdict).toBe("approved");
  });

  it("does not let a retired product cover a price or a spec", () => {
    const retired = product({ ...coat, status: "RETIRED" });
    const result = checkShoppingCopy({
      draft: "The Wool Coat is made of wool and costs $189.",
      products: [retired]
    });
    expect(result.verdict).toBe("rejected");
    expect(result.violations.map((item) => item.kind).sort()).toEqual(["unapproved_price", "unapproved_spec"]);
  });

  it("rejects a measurement the specs do not contain and allows a unit alias", () => {
    const extra = checkShoppingCopy({
      draft: "The Wool Coat weighs 4 pounds.",
      products: [coat]
    });
    expect(extra.violations.map((item) => item.kind)).toContain("unapproved_spec");

    const alias = checkShoppingCopy({
      draft: "The Wool Coat weighs 2 lb.",
      products: [coat]
    });
    expect(alias.verdict).toBe("approved");
  });

  it("rejects a spec word the saved value does not contain", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat is made of merino wool.",
      products: [coat]
    });
    expect(result.violations.map((item) => item.kind)).toContain("unapproved_spec");
  });

  it("does not treat a spec value as matching inside a longer word", () => {
    const result = checkShoppingCopy({
      draft: "The Wool Coat is made of woolen.",
      products: [coat]
    });
    expect(result.violations.map((item) => item.kind)).toContain("unapproved_spec");
  });

  it("covers a custom label and rejects a different number", () => {
    const sheet = product({
      name: "Sheet",
      specs: [{ label: "thread count", value: "400" }],
      availability: "in_stock"
    });
    const approved = checkShoppingCopy({
      draft: "The Sheet thread count is 400.",
      products: [sheet]
    });
    expect(approved.verdict).toBe("approved");

    const rejected = checkShoppingCopy({
      draft: "The Sheet thread count is 800.",
      products: [sheet]
    });
    expect(rejected.violations.map((item) => item.kind)).toContain("unapproved_spec");
  });

  it("rejects a zero-price phrase unless an active product price amount is 0", () => {
    const word = ["fr", "ee"].join("");
    const rejected = checkShoppingCopy({
      draft: `The Wool Coat is ${word}.`,
      products: [coat]
    });
    expect(rejected.violations.map((item) => item.kind)).toContain("unapproved_price");
    expect(rejected.violations.every((item) => !/\bfree\b/i.test(item.detail))).toBe(true);

    const approved = checkShoppingCopy({
      draft: `The Sample is ${word}.`,
      products: [product({ name: "Sample", price_amount: 0, price_currency: "USD", availability: "in_stock" })]
    });
    expect(approved.verdict).toBe("approved");
  });
});
