export function normalizePhone(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const hasInternationalPrefix = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (hasInternationalPrefix) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+51${digits}`;
  }

  return `+${digits}`;
}

export function toWhatsAppPhone(input: string) {
  return input.replace(/\D/g, "");
}
