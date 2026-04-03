import { describe, it, expect } from "vitest";
import {
  validateAthletePhoto,
  PHOTO_MAX_BYTES,
  PHOTO_ALLOWED_TYPES,
} from "../photoValidation";

function makeFile(name: string, type: string, sizeBytes: number): File {
  // File constructor: new File(parts, name, options)
  // We create a blob of the desired size to simulate real size checks
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("validateAthletePhoto", () => {
  describe("tamanho", () => {
    it("aceita arquivo exatamente no limite de 5 MB", () => {
      const file = makeFile("foto.jpg", "image/jpeg", PHOTO_MAX_BYTES);
      expect(validateAthletePhoto(file)).toEqual({ valid: true });
    });

    it("aceita arquivo abaixo de 5 MB", () => {
      const file = makeFile("foto.jpg", "image/jpeg", PHOTO_MAX_BYTES - 1);
      expect(validateAthletePhoto(file)).toEqual({ valid: true });
    });

    it("rejeita arquivo acima de 5 MB", () => {
      const file = makeFile("foto.jpg", "image/jpeg", PHOTO_MAX_BYTES + 1);
      const result = validateAthletePhoto(file);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/5 MB/i);
    });
  });

  describe("tipo de arquivo", () => {
    it.each(PHOTO_ALLOWED_TYPES)("aceita %s", (mimeType) => {
      const ext = mimeType.split("/")[1];
      const file = makeFile(`foto.${ext}`, mimeType, 1024);
      expect(validateAthletePhoto(file)).toEqual({ valid: true });
    });

    it("rejeita image/gif", () => {
      const file = makeFile("foto.gif", "image/gif", 1024);
      const result = validateAthletePhoto(file);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/JPG|PNG|WebP/i);
    });

    it("rejeita application/pdf", () => {
      const file = makeFile("doc.pdf", "application/pdf", 1024);
      const result = validateAthletePhoto(file);
      expect(result.valid).toBe(false);
    });

    it("rejeita string vazia como tipo", () => {
      const file = makeFile("foto", "", 1024);
      const result = validateAthletePhoto(file);
      expect(result.valid).toBe(false);
    });
  });

  describe("combinações", () => {
    it("rejeita arquivo inválido que também excede tamanho (erro de tamanho tem precedência)", () => {
      const file = makeFile("foto.gif", "image/gif", PHOTO_MAX_BYTES + 1);
      const result = validateAthletePhoto(file);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/5 MB/i);
    });

    it("retorna valid: true sem campo error quando aprovado", () => {
      const file = makeFile("foto.png", "image/png", 1024);
      const result = validateAthletePhoto(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
