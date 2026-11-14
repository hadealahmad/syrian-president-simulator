export interface BidiSegment {
  text: string;
  ltr: boolean;
}

const LTR_TOKEN_RE =
  /((?:M2\s+)?[+\u2212-]?(?:\$\s*)?\d[\d.,]*(?:[%BMK]+)?(?:\s+SP)?|\$\d[\d.,]*[BMK%]?)/g;

/**
 * Splits mixed Arabic + numeric/currency strings so LTR tokens like `+$3M`,
 * `$450`, `-3.50B SP`, or `M2 +5.2%` can each sit inside `<bdi dir="ltr">`
 * without Unicode bidi flipping signs or currency symbols in RTL paragraphs.
 */
export function splitBidiTokens(text: string): BidiSegment[] {
  if (!text) return [];
  const out: BidiSegment[] = [];
  let lastIndex = 0;
  LTR_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LTR_TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      out.push({ text: text.slice(lastIndex, match.index), ltr: false });
    }
    out.push({ text: match[0], ltr: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    out.push({ text: text.slice(lastIndex), ltr: false });
  }
  return out;
}
