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
    return isValidInternationalPhone(digits) ? `+${digits}` : null;
  }

  if (isValidPeruMobile(digits)) {
    return `+51${digits}`;
  }

  return null;
}

export function toWhatsAppPhone(input: string) {
  return input.replace(/\D/g, "");
}

export function isValidOptionalPhone(input: string | undefined) {
  if (!input?.trim()) {
    return true;
  }

  return Boolean(normalizePhone(input));
}

function isValidPeruMobile(digits: string) {
  return /^9\d{8}$/.test(digits);
}

function isValidInternationalPhone(digits: string) {
  return /^\d{8,15}$/.test(digits);
}
