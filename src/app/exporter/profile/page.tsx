'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ExporterProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(userProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">View and manage your profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <p className="text-base text-gray-900 font-medium">{profile?.contact_person || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Email Address</label>
              <p className="text-base text-gray-900 font-medium">{profile?.email || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
              <p className="text-base text-gray-900 font-medium">{profile?.phone_number || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <p className="text-base text-gray-900 font-medium capitalize">{profile?.role || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Banking Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Company Name</label>
              <p className="text-base text-gray-900 font-medium">{profile?.company_name || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Geography</label>
              <p className="text-base text-gray-900 font-medium">{profile?.geography || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Bank Account Number</label>
              <p className="text-base text-gray-900 font-medium">{profile?.bank_account_number || 'Not specified'}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">SWIFT Code</label>
              <p className="text-base text-gray-900 font-medium">{profile?.swift_code || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors">
          Edit Profile
        </button>
      </div>
    </div>
  );
}
