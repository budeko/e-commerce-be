export const SELLER_DOCUMENT_TYPES = ['taxCertificate', 'signatureCircular', 'companyLogo'] as const;

export type SellerDocumentType = (typeof SELLER_DOCUMENT_TYPES)[number];

export const SELLER_DOCUMENT_FIELD_MAP: Record<SellerDocumentType, string> = {
  taxCertificate: 'taxCertificateUrl',
  signatureCircular: 'signatureCircularUrl',
  companyLogo: 'companyLogoUrl',
};

const PDF_MIME = 'application/pdf';
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const SELLER_DOCUMENT_RULES: Record<
  SellerDocumentType,
  { mimes: readonly string[]; maxBytes: number; extension: string }
> = {
  taxCertificate: { mimes: [PDF_MIME], maxBytes: 5 * 1024 * 1024, extension: 'pdf' },
  signatureCircular: { mimes: [PDF_MIME], maxBytes: 5 * 1024 * 1024, extension: 'pdf' },
  companyLogo: { mimes: IMAGE_MIMES, maxBytes: 2 * 1024 * 1024, extension: 'jpg' },
};

export const isSellerDocumentType = (value: string): value is SellerDocumentType =>
  (SELLER_DOCUMENT_TYPES as readonly string[]).includes(value);

export const resolveDocumentExtension = (mimeType: string, docType: SellerDocumentType) => {
  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  return SELLER_DOCUMENT_RULES[docType].extension;
};
