'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth';
import { UserRole, isFunderRole } from '@/types/user';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { user, error } = await getCurrentUser();

      if (error || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data: profileData } = await getUserProfile(user.id);

      if (profileData?.role === UserRole.DBS_BANK_MAKER || profileData?.role === UserRole.DBS_BANK_CHECKER) {
        router.push('/bank/dashboard');
        return;
      }

      if (profileData?.role === UserRole.GIFT_IBU_MAKER || profileData?.role === UserRole.GIFT_IBU_CHECKER) {
        router.push('/funder/dashboard');
        return;
      }

      setProfile(profileData);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getRoleLabel = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      [UserRole.EXPORTER]: 'Exporter',
      [UserRole.IMPORTER]: 'Importer',
      [UserRole.GIFT_IBU_MAKER]: 'Gift IBU Funder - Maker (POC)',
      [UserRole.GIFT_IBU_CHECKER]: 'Gift IBU Funder - Checker',
      [UserRole.DBS_BANK_MAKER]: 'DBS Bank Importer - Maker (POC)',
      [UserRole.DBS_BANK_CHECKER]: 'DBS Bank Importer - Checker',
    };
    return roleLabels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">ICICI Trade Finance</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
              Dashboard
            </h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Welcome, {profile?.contact_person || user?.email}
                </h2>

                <div className="space-y-3 text-gray-600">
                  <p>
                    <span className="font-medium">Email:</span> {user?.email}
                  </p>
                  {profile && (
                    <>
                      <p>
                        <span className="font-medium">Role:</span> {getRoleLabel(profile.role)}
                      </p>
                      <p>
                        <span className="font-medium">Company:</span> {profile.company_name}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {profile.phone_number}
                      </p>
                    </>
                  )}
                </div>

                {profile && isFunderRole(profile.role) && (
                  <div className="mt-6 rounded-lg border-2 border-green-200 bg-green-50 p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">
                      Treasury Balance
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Initial Balance:</span>
                        <span className="text-2xl font-bold text-green-700">
                          ₹{profile.treasury_balance?.toLocaleString('en-IN') || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-green-200">
                        <span className="text-gray-700">Current Balance:</span>
                        <span className="text-2xl font-bold text-green-700">
                          ₹{profile.current_balance?.toLocaleString('en-IN') || '0.00'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-green-800">
                      {profile.role === UserRole.GIFT_IBU_MAKER || profile.role === UserRole.GIFT_IBU_CHECKER
                        ? 'ICICI Gift IBU Funder Account'
                        : 'DBS Bank Importer Account'}
                    </p>
                  </div>
                )}

                <div className="mt-6 rounded-md bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    Dashboard features coming soon. Your role-specific functionality will be displayed here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
