import { readFileSync } from "node:fs";

/** Reads a generated fixture by its route key, e.g. "explore/embodiment/none". */
export function fixture<T>(key: string): T {
  const file = new URL(`../../fixtures/generated/${key.replaceAll("/", "__")}.json`, import.meta.url);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** Markup with the injected stylesheet removed — CSS is not text a reader sees. */
function withoutStyles(markup: string): string {
  return markup.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "");
}

/** Static markup escapes its text; a reader sees "&", not "&amp;". */
function decode(text: string): string {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");
}

/**
 * The text a reader actually sees. Attributes are dropped: ids, keys and aria
 * labels legitimately carry enum values, and only rendered text is in question.
 */
export function visibleText(markup: string): string[] {
  return withoutStyles(markup)
    .split(/<[^>]*>/)
    .map((chunk) => decode(chunk).trim())
    .filter(Boolean);
}

/** The strings drawn inside the SVG, which is where a map puts its labels. */
export function svgLabels(markup: string): string[] {
  return [...withoutStyles(markup).matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
    .map((match) => decode(match[1]!.replace(/<[^>]*>/g, "")).trim())
    .filter(Boolean);
}

/**
 * A screaming-snake token is the fingerprint of an unresolved enum: no display label
 * in the vocabulary contains an underscore, so anything matching here leaked from a
 * storage identifier rather than a `label` field.
 */
export function rawEnumTokens(markup: string): string[] {
  return visibleText(markup).filter((chunk) => /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/.test(chunk));
}

/**
 * True when `drawn` is `label`, or `label` cut short with an ellipsis because its
 * territory was too narrow. Either way the string came from the response.
 */
export function isLabel(drawn: string, label: string): boolean {
  if (drawn === label) return true;
  return drawn.endsWith("…") && label.startsWith(drawn.slice(0, -1));
}
