'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '@/lib/auth';
import StatCard from '@/components/StatCard';

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

  const treasuryBalance = profile?.current_balance || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Treasury Balance"
          value={`$${treasuryBalance.toLocaleString()}`}
          subtitle="Available funds"
          color="green"
        />
        <StatCard
          title="Pending Requests"
          value={0}
          color="orange"
        />
        <StatCard
          title="Issued PTTs"
          value={0}
          color="purple"
        />
        <StatCard
          title="Total Exposure"
          value="$0"
          color="blue"
        />
        <StatCard
          title="Pending Settlements"
          value={0}
          color="orange"
        />
      </div>

      <div className="rounded-lg bg-white p-8 shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Pending PTT Requests</h2>
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">No pending requests</p>
        </div>
      </div>
    </div>
  );
}
