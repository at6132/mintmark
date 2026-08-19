import { randomBytes } from "node:crypto";

export function publicOrderId(): string {
  return `mm_${randomBytes(16).toString("hex")}`;
}

export function randomLetters(n = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(n);
  let out = "";
  for (let i = 0; i < n; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}
