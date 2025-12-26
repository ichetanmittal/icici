'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';

export default function FunderDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (user) {
        const { data: profileData } = await getUserProfile(user.id);
        setProfile(profileData);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const accountBalance = profile?.current_balance || 0;
  const availableOffers = 0; // TODO: Fetch from database
  const totalInvestment = 0; // TODO: Calculate from marketplace

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Marketplace</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Account Balance */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Account Balance</h3>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            ${accountBalance.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Available funds</p>
        </div>

        {/* Available Offers */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Available Offers</h3>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {availableOffers}
          </p>
          <p className="text-xs text-gray-500">In marketplace</p>
        </div>

        {/* Total Investment Available */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Investment Available</h3>
          <p className="text-3xl font-bold text-purple-600 mb-1">
            ${totalInvestment.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Combined asking price</p>
        </div>
      </div>

      {/* Available PTTs for Investment */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Available PTTs for Investment</h2>

        {/* Empty State */}
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">No PTTs available in marketplace</p>
        </div>
      </div>
    </div>
  );
}
