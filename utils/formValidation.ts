export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;

export function uniqueMessages(messages: string[]) {
  return Array.from(new Set(messages.filter(Boolean)));
}

export function validateRequiredText(value: string, label: string, options: { minLength?: number; maxLength?: number } = {}) {
  const trimmed = value.trim();
  const messages: string[] = [];
  const minLength = options.minLength ?? 1;

  if (!trimmed) {
    messages.push(`${label} is required.`);
  } else if (trimmed.length < minLength) {
    messages.push(`${label} must be at least ${minLength} characters.`);
  }

  if (options.maxLength && trimmed.length > options.maxLength) {
    messages.push(`${label} must be ${options.maxLength} characters or fewer.`);
  }

  return messages;
}

export function validateEmail(value: string, label = "Email address") {
  const trimmed = value.trim();
  if (!trimmed) return [`${label} is required.`];
  return EMAIL_PATTERN.test(trimmed) ? [] : [`Please enter a valid ${label.toLowerCase()}.`];
}

export function validatePhone(value: string, label = "Phone number") {
  const trimmed = value.trim();
  const digitCount = trimmed.replace(/\D/g, "").length;

  if (!trimmed) return [`${label} is required.`];
  if (!PHONE_PATTERN.test(trimmed) || digitCount < 7 || digitCount > 15) {
    return [`${label} must contain 7 to 15 digits and no letters.`];
  }

  return [];
}

export const SRI_LANKA_PHONE_PREFIX = "+94";

export function validateSriLankaLocalNumber(value: string, label = "Phone number") {
  const digitsOnly = value.trim().replace(/\D/g, "");

  if (!digitsOnly) return [`${label} is required.`];
  if (digitsOnly.length < 9 || digitsOnly.length > 10) {
    return [`${label} must have 9 to 10 digits after ${SRI_LANKA_PHONE_PREFIX}.`];
  }

  return [];
}

export function validatePassword(value: string, options: { minLength?: number } = {}) {
  const minLength = options.minLength ?? 8;
  const messages = validateRequiredText(value, "Password", { minLength });

  if (value && !/[A-Za-z]/.test(value)) messages.push("Password must include at least one letter.");
  if (value && !/\d/.test(value)) messages.push("Password must include at least one number.");

  return uniqueMessages(messages);
}

export function validateMeasurement(value: string, label: string) {
  const trimmed = value.trim();
  const numericValue = Number(trimmed);

  if (!trimmed) return [`${label} is required.`];
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed) || !Number.isFinite(numericValue)) {
    return [`${label} must be a valid number.`];
  }
  if (numericValue <= 0) return [`${label} must be greater than 0.`];
  if (numericValue > 120) return [`${label} must be 120 inches or less.`];

  return [];
}

export function validatePriceRange(minPrice: string, maxPrice: string) {
  const messages: string[] = [];
  const min = minPrice.trim();
  const max = maxPrice.trim();
  const minValue = Number(min);
  const maxValue = Number(max);

  if (min && (!/^\d+(\.\d{1,2})?$/.test(min) || !Number.isFinite(minValue) || minValue < 0)) {
    messages.push("Minimum price must be a valid positive number.");
  }

  if (max && (!/^\d+(\.\d{1,2})?$/.test(max) || !Number.isFinite(maxValue) || maxValue < 0)) {
    messages.push("Maximum price must be a valid positive number.");
  }

  if (messages.length === 0 && min && max && minValue > maxValue) {
    messages.push("Minimum price cannot be greater than maximum price.");
  }

  return messages;
}

export function validateFiles(
  files: File[],
  options: { allowedTypes: Set<string>; maxSizeBytes: number; maxFiles?: number; label?: string },
) {
  const messages: string[] = [];
  const label = options.label || "File";

  if (options.maxFiles && files.length > options.maxFiles) {
    messages.push(`You can upload up to ${options.maxFiles} files.`);
  }

  files.forEach((file) => {
    if (!options.allowedTypes.has(file.type)) {
      messages.push(`${label} must be a supported file type.`);
    }
    if (file.size > options.maxSizeBytes) {
      messages.push(`${label} must be ${Math.floor(options.maxSizeBytes / 1024 / 1024)}MB or smaller.`);
    }
  });

  return uniqueMessages(messages);
}
