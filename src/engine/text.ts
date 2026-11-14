const EMAILISH = /[^\s@]+@[^\s@]+/g;

/** Free text from users can contain an email address. Analytics must never get one. */
export function redact(text: string): string {
  return text.replace(EMAILISH, "[email]");
}

const LABEL = "[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
const EMAIL = new RegExp(`^[^\\s@]+@${LABEL}(?:\\.${LABEL})*\\.[a-z]{2,}$`, "i");
const INVISIBLE = /[\u200B-\u200D\uFEFF]/g;

/** Returns the cleaned address, or null if it doesn't look like a real email. */
export function cleanEmail(raw: string): string | null {
  const v = raw.replace(INVISIBLE, "").trim();
  return EMAIL.test(v) ? v : null;
}
