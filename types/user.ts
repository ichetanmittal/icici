export enum UserRole {
  EXPORTER = 'exporter',
  IMPORTER = 'importer',
  GIFT_IBU_MAKER = 'gift_ibu_maker',
  GIFT_IBU_CHECKER = 'gift_ibu_checker',
  DBS_BANK_MAKER = 'dbs_bank_maker',
  DBS_BANK_CHECKER = 'dbs_bank_checker',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  treasuryBalance?: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface UserProfile {
  userId: string;
  role: UserRole;
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  treasuryBalance?: number;
  currentBalance?: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export const isFunderRole = (role: UserRole): boolean => {
  return [
    UserRole.GIFT_IBU_MAKER,
    UserRole.GIFT_IBU_CHECKER,
    UserRole.DBS_BANK_MAKER,
    UserRole.DBS_BANK_CHECKER,
  ].includes(role);
};
