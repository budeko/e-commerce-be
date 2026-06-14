import type { AuthTokenPayload } from '@/lib/security/access-token';
import { HttpError } from '@/lib/common/errors';
import {
  deleteFromSellerStorage,
  getSupabaseConfig,
  parseStorageObjectPathFromPublicUrl,
  uploadToSellerStorage,
} from '@/lib/integrations/supabase/supabase';
import { Seller } from '@/db';
import { AuthError } from '@/features/auth/core/errors';
import {
  buildSellerDocumentObjectPath,
  isSellerDocumentType,
  resolveAcceptedMimeType,
  resolveDocumentExtension,
  SELLER_DOCUMENT_FIELD_MAP,
  SELLER_DOCUMENT_RULES,
  type SellerDocumentType,
} from '@/features/auth/core/profile/seller-document-types';
import type { SellerProfileUpdateInput } from '@/features/auth/account/profile/profile.schema';
import { updateSellerProfile } from '@/features/auth/account/profile/seller.service';

export type UploadSellerDocumentInput = {
  docType: string;
  mimeType: string;
  buffer: Buffer;
};

export const uploadSellerDocument = async (
  auth: AuthTokenPayload,
  input: UploadSellerDocumentInput
) => {
  if (auth.role !== 'seller') {
    throw new AuthError(403, 'Bu endpoint sadece satıcılar içindir');
  }

  if (!isSellerDocumentType(input.docType)) {
    throw new AuthError(400, 'Geçersiz belge tipi');
  }

  const docType: SellerDocumentType = input.docType;
  const rules = SELLER_DOCUMENT_RULES[docType];
  const mimeType = resolveAcceptedMimeType(docType, input.mimeType, input.buffer);

  if (!mimeType) {
    throw new AuthError(400, 'Geçersiz dosya türü');
  }

  if (input.buffer.length === 0) {
    throw new AuthError(400, 'Dosya boş olamaz');
  }

  if (input.buffer.length > rules.maxBytes) {
    throw new AuthError(400, 'Dosya boyutu limiti aşıldı');
  }

  const seller = await Seller.findById(auth.userId).lean();

  if (!seller) {
    throw new AuthError(404, 'Satıcı profili bulunamadı');
  }

  const extension = resolveDocumentExtension(mimeType, docType);
  const objectPath = buildSellerDocumentObjectPath(auth.userId, docType, extension);
  const profileField = SELLER_DOCUMENT_FIELD_MAP[docType];
  const oldUrl = seller[profileField as keyof typeof seller];

  if (typeof oldUrl === 'string' && oldUrl.trim()) {
    const { bucket } = getSupabaseConfig();
    const oldObjectPath = parseStorageObjectPathFromPublicUrl(oldUrl, bucket);

    if (oldObjectPath && oldObjectPath !== objectPath) {
      await deleteFromSellerStorage(oldObjectPath);
    }
  }

  let url: string;

  try {
    url = await uploadToSellerStorage(objectPath, input.buffer, mimeType);
  } catch (error) {
    if (error instanceof HttpError) {
      throw new AuthError(error.statusCode, error.message);
    }

    throw error;
  }

  const profileUpdate = { [profileField]: url } as SellerProfileUpdateInput;
  const result = await updateSellerProfile(auth.userId, profileUpdate);

  return {
    docType,
    url,
    field: profileField,
    approvalStatus: result.approvalStatus,
    profile: result.profile,
  };
};
