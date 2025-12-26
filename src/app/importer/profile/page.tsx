'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface UserProfile {
  company_name: string;
  contact_person: string;
  phone_number: string;
  geography?: string;
  credit_limit?: number;
  account_balance?: number;
  bank_name?: string;
  bank_account_number?: string;
  swift_code?: string;
  email?: string;
}

export default function ImporterProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile({
          ...profileData,
          email: user.email,
        });
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Full Name</label>
            <p className="text-base text-gray-900 font-medium">{profile?.contact_person || 'Not specified'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Email Address</label>
            <p className="text-base text-gray-900 font-medium">{profile?.email || 'Not specified'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Organization</label>
            <p className="text-base text-gray-900 font-medium">{profile?.company_name || 'Not specified'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
            <p className="text-base text-gray-900 font-medium">{profile?.phone_number || 'Not specified'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Geography</label>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <p className="text-base text-gray-900 font-medium">{profile?.geography || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Banking Information */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900">Banking Information</h2>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Bank Name</label>
            <p className="text-base text-gray-900 font-medium italic">{profile?.bank_name || 'Not linked'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Bank Account Number</label>
            <p className="text-base text-gray-900 font-medium">{profile?.bank_account_number || 'Not specified'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">IFSC / SWIFT Code</label>
            <p className="text-base text-gray-900 font-medium">{profile?.swift_code || 'Not specified'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Account Balance</label>
            <p className="text-2xl font-bold text-green-600">
              ${profile?.account_balance?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
