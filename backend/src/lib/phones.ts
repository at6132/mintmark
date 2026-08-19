import { env } from "../env.js";

export function normalizeE164(input: string): string {
  let value = input.trim();
  if (value.toLowerCase().startsWith("whatsapp:")) value = value.slice("whatsapp:".length).trim();
  value = value.replace(/[^\d+]/g, "");
  if (!value.startsWith("+")) value = `+${value.replace(/^\+/, "")}`;
  return value;
}

export function operatorNumbers(): string[] {
  return env()
    .ADMIN_WHATSAPP_NUMBERS.split(/[,;\s]+/)
    .map((n) => n.trim())
    .filter(Boolean)
    .map(normalizeE164);
}

export function isOperatorPhone(phone: string): boolean {
  const needle = normalizeE164(phone);
  return operatorNumbers().some((allowed) => allowed === needle);
}
