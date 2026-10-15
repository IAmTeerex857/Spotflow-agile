export type DeckId = "scrum" | "fibonacci" | "sequential" | "hours" | "tshirt" | "custom";

export type DeckPreset = { id: Exclude<DeckId, "custom">; label: string; values: string[]; preview: string };

const COMMON = ["?", "☕"];

function preset(id: DeckPreset["id"], label: string, values: string[]): DeckPreset {
  return { id, label, values: [...values, ...COMMON], preview: values.slice(0, 5).join(" ") };
}

/** Scrum and Fibonacci come from the product spec; the others are the common team defaults. */
export const DECK_PRESETS: DeckPreset[] = [
  preset("scrum", "Scrum", ["0", "½", "1", "2", "3", "5", "8", "13", "20", "40", "100"]),
  preset("fibonacci", "Fibonacci", ["0", "1", "2", "3", "5", "8", "13", "21", "34", "55", "89"]),
  preset("sequential", "Sequential", ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]),
  preset("hours", "Hours", ["0", "1", "2", "4", "8", "12", "16", "24", "32", "40"]),
  preset("tshirt", "T-shirt", ["XS", "S", "M", "L", "XL", "XXL"]),
];

export const DECK_OPTIONS: { value: DeckId; label: string }[] = [
  ...DECK_PRESETS.map((d) => ({ value: d.id, label: d.label })),
  { value: "custom", label: "Custom deck" },
];

export function deckValues(id: DeckId): string[] {
  return (DECK_PRESETS.find((d) => d.id === id) ?? DECK_PRESETS[0]).values;
}

export function deckLabel(id: DeckId): string {
  return DECK_OPTIONS.find((d) => d.value === id)?.label ?? "Custom deck";
}

/** Numeric value of a card, or null for cards that don't count toward an average. */
export function cardNumber(value: string): number | null {
  if (value === "½") return 0.5;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
