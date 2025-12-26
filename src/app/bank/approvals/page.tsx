'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import { UserRole } from '@/types/user';

export default function PendingApprovalsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        const { data } = await getUserProfile(user.id);
        setProfile(data);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const isChecker = profile?.role === UserRole.DBS_BANK_CHECKER || profile?.role === UserRole.GIFT_IBU_CHECKER;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
          View Only
        </span>
      </div>

      {!isChecker && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              i
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> You need Checker or Admin role to approve actions.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Actions Awaiting Approval</h2>
          <span className="text-sm text-gray-500">0 pending actions</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-gray-500 mb-2">No pending actions</p>
          <p className="text-sm text-gray-400">Actions submitted by makers will appear here for approval</p>
        </div>
      </div>
    </div>
  );
}
