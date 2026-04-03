export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const PHOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoMimeType = (typeof PHOTO_ALLOWED_TYPES)[number];

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAthletePhoto(file: File): PhotoValidationResult {
  if (file.size > PHOTO_MAX_BYTES) {
    return { valid: false, error: "A foto deve ter no máximo 5 MB" };
  }
  if (!(PHOTO_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return { valid: false, error: "Formato aceito: JPG, PNG ou WebP" };
  }
  return { valid: true };
}
