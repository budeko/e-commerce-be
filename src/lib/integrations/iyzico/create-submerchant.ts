import Iyzipay from 'iyzipay';
import { getIyzicoClient } from '@/lib/integrations/iyzico/client';
import { formatIyzicoPhone } from '@/lib/integrations/iyzico/format';
import { promisifyIyzipay } from '@/lib/integrations/iyzico/promisify';
import { EcommerceError } from '@/lib/ecommerce/errors';

type SellerSubMerchantProfile = {
  sellerId: string;
  email: string;
  sellerType?: 'bireysel' | 'kurumsal' | null;
  companyType?: 'ltd' | 'as' | 'diger' | null;
  firstName?: string | null;
  lastName?: string | null;
  authorizedFirstName?: string | null;
  authorizedLastName?: string | null;
  phone?: string | null;
  companyPhone?: string | null;
  companyName?: string | null;
  taxNumber?: string | null;
  taxOffice?: string | null;
  companyAddress?: string | null;
  iban?: string | null;
};

const resolveContactName = (profile: SellerSubMerchantProfile) => {
  const firstName = profile.authorizedFirstName ?? profile.firstName;
  const lastName = profile.authorizedLastName ?? profile.lastName;

  if (!firstName || !lastName) {
    throw new EcommerceError(400, 'Satıcı ad/soyad bilgisi eksik');
  }

  return { contactName: firstName, contactSurname: lastName };
};

const resolvePhone = (profile: SellerSubMerchantProfile) => {
  const phone = profile.companyPhone ?? profile.phone;

  if (!phone) {
    throw new EcommerceError(400, 'Satıcı telefon bilgisi eksik');
  }

  return formatIyzicoPhone(phone);
};

const buildSubMerchantRequest = (profile: SellerSubMerchantProfile) => {
  if (!profile.email) {
    throw new EcommerceError(400, 'Satıcı e-posta bilgisi eksik');
  }

  if (!profile.iban?.trim()) {
    throw new EcommerceError(400, 'Satıcı IBAN bilgisi eksik');
  }

  if (!profile.companyAddress?.trim()) {
    throw new EcommerceError(400, 'Satıcı adres bilgisi eksik');
  }

  const { contactName, contactSurname } = resolveContactName(profile);
  const gsmNumber = resolvePhone(profile);
  const base = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: profile.sellerId,
    subMerchantExternalId: profile.sellerId,
    email: profile.email,
    gsmNumber,
    address: profile.companyAddress,
    iban: profile.iban.replace(/\s+/g, '').toUpperCase(),
    currency: Iyzipay.CURRENCY.TRY,
  };

  if (profile.sellerType === 'bireysel') {
    if (!profile.taxNumber?.trim()) {
      throw new EcommerceError(400, 'Bireysel satıcı için TC kimlik no eksik');
    }

    return {
      ...base,
      subMerchantType: Iyzipay.SUB_MERCHANT_TYPE.PERSONAL,
      contactName,
      contactSurname,
      identityNumber: profile.taxNumber.trim(),
      name: `${contactName} ${contactSurname}`.trim(),
    };
  }

  if (!profile.companyName?.trim()) {
    throw new EcommerceError(400, 'Kurumsal satıcı için şirket adı eksik');
  }

  if (!profile.taxNumber?.trim()) {
    throw new EcommerceError(400, 'Kurumsal satıcı için vergi no eksik');
  }

  if (!profile.taxOffice?.trim()) {
    throw new EcommerceError(400, 'Kurumsal satıcı için vergi dairesi eksik');
  }

  const isLimitedCompany =
    profile.companyType === 'ltd' || profile.companyType === 'as';

  if (isLimitedCompany) {
    return {
      ...base,
      subMerchantType: Iyzipay.SUB_MERCHANT_TYPE.LIMITED_OR_JOINT_STOCK_COMPANY,
      taxOffice: profile.taxOffice.trim(),
      taxNumber: profile.taxNumber.trim(),
      legalCompanyTitle: profile.companyName.trim(),
      name: profile.companyName.trim(),
    };
  }

  return {
    ...base,
    subMerchantType: Iyzipay.SUB_MERCHANT_TYPE.PRIVATE_COMPANY,
    contactName,
    contactSurname,
    taxOffice: profile.taxOffice.trim(),
    taxNumber: profile.taxNumber.trim(),
    name: profile.companyName.trim(),
  };
};

export const createIyzicoSubMerchant = async (
  profile: SellerSubMerchantProfile
): Promise<string> => {
  const client = getIyzicoClient();
  const request = buildSubMerchantRequest(profile);

  const result = await promisifyIyzipay(
    client.subMerchant.create!.bind(client.subMerchant),
    request
  );

  if (result.status !== 'success' || !result.subMerchantKey) {
    throw new EcommerceError(
      502,
      result.errorMessage ?? 'Iyzico alt üye kaydı oluşturulamadı'
    );
  }

  return result.subMerchantKey;
};
