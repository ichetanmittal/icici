import { supabase } from './supabase';
import { UserRole } from '@/types/user';

export interface SignUpData {
  email: string;
  password: string;
  role: UserRole;
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  treasuryBalance?: number;
  geography?: string;
  creditLimit?: number;
  bankName?: string;
  bankAccountNumber?: string;
  swiftCode?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const signUp = async (data: SignUpData) => {
  try {
    const { email, password, role, companyName, contactPerson, phoneNumber, treasuryBalance, geography, creditLimit, bankName, bankAccountNumber, swiftCode } = data;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          company_name: companyName,
          contact_person: contactPerson,
          phone_number: phoneNumber,
          treasury_balance: treasuryBalance,
        },
      },
    });

    if (authError) throw authError;

    if (authData.user) {
      const profileData: any = {
        user_id: authData.user.id,
        role,
        company_name: companyName,
        contact_person: contactPerson,
        phone_number: phoneNumber,
      };

      if (treasuryBalance !== undefined) {
        profileData.treasury_balance = treasuryBalance;
        profileData.current_balance = treasuryBalance;
      }

      if (geography) {
        profileData.geography = geography;
      }

      if (creditLimit !== undefined) {
        profileData.credit_limit = creditLimit;
      }

      if (bankName) {
        profileData.bank_name = bankName;
      }

      if (bankAccountNumber) {
        profileData.bank_account_number = bankAccountNumber;
      }

      if (swiftCode) {
        profileData.swift_code = swiftCode;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData);

      if (profileError) throw profileError;
    }

    return { data: authData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signIn = async ({ email, password }: SignInData) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
