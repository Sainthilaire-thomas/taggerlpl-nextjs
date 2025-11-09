export const sanitizeFilename = (name: string): string =>
  name.replace(/[^\w.\-]+/g, "_").slice(-128);
