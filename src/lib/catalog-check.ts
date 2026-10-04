export type AvailabilityKind = "in_stock" | "out_of_stock" | "quantity";

export type ProductSpec = {
  label: string;
  value: string;
};

export type CatalogProduct = {
  name: string;
  sku?: string | null;
  specs?: ProductSpec[] | null;
  price_amount: number | string;
  price_currency: string;
  availability: string;
  quantity?: number | string | null;
  status: string;
};

export type ViolationKind = "unapproved_spec" | "unapproved_price" | "unapproved_stock";

export type Violation = {
  kind: ViolationKind;
  detail: string;
  excerpt: string;
};

export type CheckResult = {
  verdict: "approved" | "rejected";
  violations: Violation[];
};

type Marker = { label: string; pattern: RegExp };
type PriceHit = { cents: number; currency: string };
type StockHit = { kind: "in_stock" | "out_of_stock" | "quantity"; quantity?: number; excerpt: string };

const KNOWN_MARKERS: Marker[] = [
  { label: "material", pattern: /\b(?:made of|made from|crafted from|material(?:\s+is|:)|fabric(?:\s+is|:))\b/i },
  { label: "color", pattern: /\bcolou?r(?:\s+is|:)\b/i },
  { label: "size", pattern: /\bsize(?:\s+is|:)\b/i },
  { label: "weight", pattern: /\b(?:weighs|weighing|weight(?:\s+is|:))\b/i },
  { label: "length", pattern: /\blength(?=\s+is|\s*:|\s+\d)/i },
  { label: "width", pattern: /\bwidth(?=\s+is|\s*:|\s+\d)/i },
  { label: "height", pattern: /\bheight(?=\s+is|\s*:|\s+\d)/i },
  { label: "depth", pattern: /\bdepth(?=\s+is|\s*:|\s+\d)/i },
  { label: "diameter", pattern: /\bdiameter(?=\s+is|\s*:|\s+\d)/i },
  { label: "capacity", pattern: /\bcapacity(?=\s+is|\s*:|\s+\d)/i },
  { label: "wattage", pattern: /\b(?:wattage(?=\s+is|\s*:|\s+\d)|watts?\b)/i },
  { label: "battery", pattern: /\bbattery(?=\s+is|\s*:|\s+\d)/i },
  { label: "ingredient", pattern: /\bingredients?(?:\s+are|\s+is|:)/i },
  { label: "origin", pattern: /\b(?:origin(?:\s+is|:)|made in)\b/i },
  { label: "dimensions", pattern: /\bdimensions?(?:\s+are|\s+is|:)/i },
  { label: "finish", pattern: /\bfinish(?:\s+is|:)/i },
  { label: "scent", pattern: /\bscent(?:\s+is|:)/i },
  { label: "flavor", pattern: /\bflavou?r(?:\s+is|:)/i },
  { label: "model", pattern: /\bmodel(?:\s+number(?:\s+is|:)?|\s+is|:)/i },
  { label: "compatibility", pattern: /\b(?:compatibility(?:\s+is|:)|compatible with)\b/i },
  { label: "fit", pattern: /\bfit(?:\s+is|:)/i }
];

const LABEL_ALIASES: Record<string, string> = {
  fabric: "material",
  colour: "color",
  weighs: "weight",
  weigh: "weight",
  weighing: "weight",
  watt: "wattage",
  watts: "wattage",
  ingredients: "ingredient",
  flavour: "flavor",
  "model number": "model",
  "compatible with": "compatibility",
  "made in": "origin"
};

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "to", "of", "from", "in", "on", "for", "and", "or",
  "with", "by", "it", "its", "this", "that", "these", "those", "our", "your", "their", "per", "at", "as"
]);

const UNIT_CANON: Array<[RegExp, string]> = [
  [/\b(\d+(?:\.\d+)?)\s*(?:inches|inch)\b/gi, "$1 in"],
  [/\b(\d+(?:\.\d+)?)\s*in\b/gi, "$1 in"],
  [/\b(\d+(?:\.\d+)?)\s*(?:centimeters|centimeter|cm)\b/gi, "$1 cm"],
  [/\b(\d+(?:\.\d+)?)\s*(?:millimeters|millimeter|mm)\b/gi, "$1 mm"],
  [/\b(\d+(?:\.\d+)?)\s*(?:kilograms|kilogram|kg)\b/gi, "$1 kg"],
  [/\b(\d+(?:\.\d+)?)\s*(?:grams|gram|g)\b/gi, "$1 g"],
  [/\b(\d+(?:\.\d+)?)\s*(?:ounces|ounce|oz)\b/gi, "$1 oz"],
  [/\b(\d+(?:\.\d+)?)\s*(?:pounds|pound|lbs|lb)\b/gi, "$1 lb"],
  [/\b(\d+(?:\.\d+)?)\s*(?:feet|ft)\b/gi, "$1 ft"],
  [/\b(\d+(?:\.\d+)?)\s*(?:milliliters|milliliter|ml)\b/gi, "$1 ml"],
  [/\b(\d+(?:\.\d+)?)\s*(?:liters|liter|l)\b/gi, "$1 l"],
  [/\b(\d+(?:\.\d+)?)\s*(?:watts|watt)\b/gi, "$1 watt"],
  [/\b(\d+(?:\.\d+)?)\s*mah\b/gi, "$1 mah"]
];

const WORD_CANON: Record<string, string> = {
  inches: "in",
  inch: "in",
  in: "in",
  centimeters: "cm",
  centimeter: "cm",
  cm: "cm",
  millimeters: "mm",
  millimeter: "mm",
  mm: "mm",
  kilograms: "kg",
  kilogram: "kg",
  kg: "kg",
  grams: "g",
  gram: "g",
  g: "g",
  ounces: "oz",
  ounce: "oz",
  oz: "oz",
  pounds: "lb",
  pound: "lb",
  lbs: "lb",
  lb: "lb",
  feet: "ft",
  ft: "ft",
  milliliters: "ml",
  milliliter: "ml",
  ml: "ml",
  liters: "l",
  liter: "l",
  l: "l",
  watts: "watt",
  watt: "watt",
  mah: "mah"
};

const ZERO_PRICE = /\b(?:free|complimentary|gratis)\b|\bno charge\b|\bon the house\b/i;

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function soften(value: string) {
  return normalize(value).replace(/[.,!?;:]+/g, " ").replace(/\s+/g, " ").trim();
}

function sentences(text: string) {
  const parts = text.split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts : [text.trim()].filter(Boolean);
}

function excerpt(text: string, limit = 240) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1)}…`;
}

function phrasePattern(phrase: string) {
  const trimmed = phrase.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const start = /^\w/u.test(trimmed) ? "\\b" : "";
  const end = /\w$/u.test(trimmed) ? "\\b" : "";
  return new RegExp(`${start}${escaped}${end}`, "i");
}

function numbersIn(text: string) {
  return [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => String(Number(match[0])));
}

export function parseAmount(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const amount = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(amount) || amount < 0) return null;
  const cents = Math.round(amount * 100);
  if (Math.abs(amount * 100 - cents) > 0.001) return null;
  return cents;
}

function currencyCode(token: string) {
  const key = token.toLocaleLowerCase();
  const map: Record<string, string> = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
    usd: "USD",
    dollar: "USD",
    dollars: "USD",
    eur: "EUR",
    euro: "EUR",
    euros: "EUR",
    gbp: "GBP",
    pound: "GBP",
    pounds: "GBP"
  };
  return map[key] ?? null;
}

function canonicalLabel(label: string) {
  const normalized = normalize(label);
  return LABEL_ALIASES[normalized] ?? normalized;
}

function specsOf(product: CatalogProduct): ProductSpec[] {
  if (!Array.isArray(product.specs)) return [];
  return product.specs.filter((spec) => spec && typeof spec.label === "string" && typeof spec.value === "string" && spec.value.trim());
}

function isActive(product: CatalogProduct) {
  return product.status === "ACTIVE" && product.name.trim().length > 0;
}

function mentioned(text: string, product: CatalogProduct) {
  if (product.name.trim().length >= 2 && phrasePattern(product.name).test(text)) return true;
  const sku = (product.sku ?? "").trim();
  return sku.length >= 2 && phrasePattern(sku).test(text);
}

function productPrice(product: CatalogProduct) {
  const cents = parseAmount(product.price_amount);
  const currency = product.price_currency.trim().toUpperCase();
  if (cents === null || !/^[A-Z]{3}$/.test(currency)) return null;
  return { cents, currency };
}

function pricesIn(sentence: string): PriceHit[] {
  const hits: PriceHit[] = [];
  const push = (amount: string, token: string) => {
    const cents = parseAmount(amount);
    const currency = currencyCode(token);
    if (cents === null || !currency) return;
    if (hits.some((hit) => hit.cents === cents && hit.currency === currency)) return;
    hits.push({ cents, currency });
  };
  for (const match of sentence.matchAll(/([$€£])\s*(\d+(?:\.\d+)?)/g)) push(match[2], match[1]);
  for (const match of sentence.matchAll(/\b(\d+(?:\.\d+)?)\s*(usd|eur|gbp|dollars?|euros?)\b/gi)) push(match[1], match[2]);
  for (const match of sentence.matchAll(/\b(usd|eur|gbp)\s+(\d+(?:\.\d+)?)\b/gi)) push(match[2], match[1]);
  if (ZERO_PRICE.test(sentence) && !hits.some((hit) => hit.cents === 0 && hit.currency === "")) {
    hits.push({ cents: 0, currency: "" });
  }
  return hits;
}

function priceAllowed(hit: PriceHit, product: CatalogProduct) {
  const price = productPrice(product);
  if (!price || price.cents !== hit.cents) return false;
  if (!hit.currency) return true;
  return price.currency === hit.currency;
}

function stockIn(sentence: string): StockHit | null {
  const quantityPatterns = [
    /\bonly\s+(\d+)\s+left\b/i,
    /\b(\d+)\s+left\b/i,
    /\b(\d+)\s+remaining\b/i,
    /\b(\d+)\s+in stock\b/i,
    /\b(\d+)\s+available\b/i,
    /\bquantity(?:\s+of)?\s+(\d+)\b/i,
    /\b(\d+)\s+units?\b/i
  ];
  for (const pattern of quantityPatterns) {
    const match = pattern.exec(sentence);
    if (match) return { kind: "quantity", quantity: Number(match[1]), excerpt: match[0] };
  }
  const out = sentence.match(/\b(?:out of stock|sold out|unavailable)\b/i);
  if (out) return { kind: "out_of_stock", excerpt: out[0] };
  const available = sentence.match(/\b(?:in stock|available now)\b/i);
  if (available) return { kind: "in_stock", excerpt: available[0] };
  return null;
}

function stockAllowed(hit: StockHit, product: CatalogProduct) {
  const quantity = product.quantity == null || product.quantity === "" ? null : Number(product.quantity);
  if (hit.kind === "quantity") {
    return product.availability === "quantity" && Number.isInteger(quantity) && quantity === hit.quantity;
  }
  if (hit.kind === "in_stock") return product.availability === "in_stock";
  return product.availability === "out_of_stock";
}

function withoutStock(sentence: string) {
  return sentence
    .replace(/\bonly\s+\d+\s+left\b/gi, " ")
    .replace(/\b\d+\s+left\b/gi, " ")
    .replace(/\b\d+\s+remaining\b/gi, " ")
    .replace(/\b\d+\s+in stock\b/gi, " ")
    .replace(/\b\d+\s+available\b/gi, " ")
    .replace(/\bquantity(?:\s+of)?\s+\d+\b/gi, " ")
    .replace(/\b\d+\s+units?\b/gi, " ")
    .replace(/\b(?:out of stock|sold out|unavailable|in stock|available now)\b/gi, " ");
}

function normalizeMeasurements(text: string) {
  let value = soften(text);
  for (const [pattern, replacement] of UNIT_CANON) value = value.replace(pattern, replacement);
  return value;
}

function measurementsIn(sentence: string) {
  const source = withoutStock(sentence);
  const found = new Set<string>();
  const pattern = /\b\d+(?:\.\d+)?\s*(?:inches|inch|in|centimeters|centimeter|cm|millimeters|millimeter|mm|kilograms|kilogram|kg|grams|gram|g|ounces|ounce|oz|pounds|pound|lbs|lb|feet|ft|milliliters|milliliter|ml|liters|liter|l|watts|watt|mah)\b/gi;
  for (const match of source.matchAll(pattern)) {
    const normalized = normalizeMeasurements(match[0]);
    if (normalized) found.add(normalized);
  }
  return [...found];
}

function measurementCovered(measurement: string, product: CatalogProduct) {
  const blob = normalizeMeasurements(specsOf(product).map((spec) => `${spec.label} ${spec.value}`).join(" "));
  return blob.includes(measurement);
}

function withoutPrices(text: string) {
  return text
    .replace(/[$€£]\s*\d+(?:\.\d+)?/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:usd|eur|gbp|dollars?|euros?)\b/gi, " ")
    .replace(/\b(?:usd|eur|gbp)\s+\d+(?:\.\d+)?\b/gi, " ")
    .replace(/\b(?:costs?|priced|price)\b/gi, " ");
}

function labelClaimPattern(label: string) {
  const trimmed = label.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const start = /^\w/u.test(trimmed) ? "\\b" : "";
  return new RegExp(`${start}${escaped}(?:\\s+is|\\s*:)`, "i");
}

function findMarkers(sentence: string, products: CatalogProduct[]) {
  const found: Marker[] = [];
  const seen = new Set<string>();
  for (const marker of KNOWN_MARKERS) {
    if (!marker.pattern.test(sentence)) continue;
    const label = canonicalLabel(marker.label);
    if (seen.has(label)) continue;
    seen.add(label);
    found.push({ label, pattern: marker.pattern });
  }
  for (const product of products) {
    for (const spec of specsOf(product)) {
      const raw = spec.label.trim();
      if (raw.length < 3) continue;
      const label = canonicalLabel(raw);
      if (seen.has(label)) continue;
      const pattern = labelClaimPattern(raw);
      if (!pattern.test(sentence)) continue;
      seen.add(label);
      found.push({ label, pattern });
    }
  }
  return found;
}

function contentWords(text: string) {
  return soften(text)
    .split(" ")
    .filter((word) => word && !STOPWORDS.has(word) && !/^\d+(?:\.\d+)?$/.test(word))
    .map((word) => WORD_CANON[word] ?? word);
}

function spanAfter(sentence: string, pattern: RegExp, markers: Marker[]) {
  const match = new RegExp(pattern.source, pattern.flags.replace("g", "")).exec(sentence);
  if (!match) return "";
  const rest = sentence.slice(match.index + match[0].length);
  let end = rest.length;
  for (const marker of markers) {
    if (marker.pattern.source === pattern.source) continue;
    const next = new RegExp(marker.pattern.source, marker.pattern.flags.replace("g", "")).exec(rest);
    if (next && next.index < end) end = next.index;
  }
  return (rest.slice(0, end).split(/[.!?;]/)[0] ?? "").trim();
}

function markerCovered(sentence: string, marker: Marker, markers: Marker[], product: CatalogProduct) {
  const specs = specsOf(product).filter((spec) => canonicalLabel(spec.label) === marker.label);
  if (!specs.length) return false;
  const span = withoutPrices(spanAfter(sentence, marker.pattern, markers));
  const spanWords = contentWords(span);
  const spanNumbers = numbersIn(span);
  return specs.some((spec) => {
    const valueWords = contentWords(spec.value);
    const valueNumbers = numbersIn(spec.value);
    const sentenceWords = new Set(contentWords(sentence));
    const valuePresent = valueWords.length
      ? valueWords.some((word) => sentenceWords.has(word))
      : valueNumbers.every((number) => numbersIn(sentence).includes(number));
    if (!valuePresent) return false;
    if (!spanWords.every((word) => valueWords.includes(word))) return false;
    return spanNumbers.every((number) => valueNumbers.includes(number));
  });
}

function namedActive(sentence: string, active: CatalogProduct[]) {
  return active.filter((product) => mentioned(sentence, product));
}

export function checkShoppingCopy(input: { draft: string; products: CatalogProduct[] }): CheckResult {
  const draft = input.draft ?? "";
  const products = Array.isArray(input.products) ? input.products : [];
  const active = products.filter(isActive);
  const retired = products.filter((product) => !isActive(product));
  const violations: Violation[] = [];
  const push = (violation: Violation) => {
    if (violations.some((existing) => existing.kind === violation.kind && existing.detail === violation.detail && existing.excerpt === violation.excerpt)) return;
    if (violations.length < 20) violations.push(violation);
  };

  for (const sentence of sentences(draft)) {
    const named = namedActive(sentence, active);
    const retiredNamed = retired.some((product) => mentioned(sentence, product));
    const attributed = named.length ? named : retiredNamed ? [] : active.length === 1 ? active : [];
    const unattributed = !named.length && !retiredNamed && active.length !== 1;

    for (const price of pricesIn(sentence)) {
      const covered = named.length
        ? named.every((product) => priceAllowed(price, product))
        : !retiredNamed && active.some((product) => priceAllowed(price, product));
      if (!covered) {
        push({
          kind: "unapproved_price",
          detail: named.length
            ? "Draft states a price that this product's approved price does not allow."
            : "Draft states a price that no active product in this catalog allows.",
          excerpt: excerpt(sentence)
        });
      }
    }

    const stock = stockIn(sentence);
    if (stock) {
      const covered = attributed.length > 0 && attributed.every((product) => stockAllowed(stock, product));
      if (!covered) {
        push({
          kind: "unapproved_stock",
          detail: unattributed
            ? "Draft states a stock level without naming an active catalog product that allows it."
            : "Draft states a stock level that the approved availability does not allow.",
          excerpt: excerpt(stock.excerpt)
        });
      }
    }

    const markers = findMarkers(sentence, products);
    const measurements = measurementsIn(sentence);
    if (!markers.length && !measurements.length) continue;
    if (!attributed.length) {
      push({
        kind: "unapproved_spec",
        detail: unattributed
          ? "Draft states a spec without naming an active catalog product that includes it."
          : "Draft states a spec that no active product in this catalog includes.",
        excerpt: excerpt(sentence)
      });
      continue;
    }
    for (const product of attributed) {
      const missingMarker = markers.some((marker) => !markerCovered(sentence, marker, markers, product));
      const missingMeasurement = measurements.some((measurement) => !measurementCovered(measurement, product));
      if (missingMarker || missingMeasurement) {
        push({
          kind: "unapproved_spec",
          detail: "Draft states a spec that this product's approved specs do not include.",
          excerpt: excerpt(sentence)
        });
      }
    }
  }

  return { verdict: violations.length ? "rejected" : "approved", violations };
}
